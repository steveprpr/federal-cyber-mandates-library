import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import mandatesJson from "../src/data/mandates.json" with { type: "json" };
import {
  mandateCollectionSchema,
  mandateSchema,
  type Mandate,
} from "../src/lib/schema";
import {
  findDuplicates,
  isOfficialSource,
  validateRelationships,
  verifyZeroTrustExcerpts,
} from "../src/lib/validation";

const current = mandateCollectionSchema.parse(mandatesJson);
const report: string[] = [
  "# Federal Cyber Mandates update report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
];
const proposed: Mandate[] = [];
let estimatedInput = 0,
  estimatedOutput = 0;
const indexes = [
  "https://www.cisa.gov/news-events/directives",
  "https://csrc.nist.gov/publications",
  "https://www.whitehouse.gov/omb/information-for-agencies/memoranda/",
];
async function extract(response: Response) {
  const type = response.headers.get("content-type") ?? "";
  const body = Buffer.from(await response.arrayBuffer());
  if (type.includes("pdf") || response.url.toLowerCase().endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: body });
    try {
      return {
        text: (await parser.getText()).text,
        hash: createHash("sha256").update(body).digest("hex"),
      };
    } finally {
      await parser.destroy();
    }
  }
  const html = body.toString("utf8");
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { text, hash: createHash("sha256").update(text).digest("hex") };
}
async function draft(item: Mandate, text: string, hash: string) {
  const key = process.env.OPENROUTER_API_KEY,
    model = process.env.OPENROUTER_MODEL ?? "qwen/qwen3.5-27b";
  if (!key)
    throw new Error(
      "OPENROUTER_API_KEY is required only when a source changed.",
    );
  const schema = {
    name: "federal_mandate",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: Object.keys(mandateSchema.shape),
      properties: Object.fromEntries(
        Object.keys(mandateSchema.shape).map((k) => [
          k,
          {
            type:
              k === "zeroTrust"
                ? "boolean"
                : k.endsWith("Date")
                  ? "string"
                  : [
                        "executiveHighlights",
                        "requirements",
                        "affectedOrganizations",
                        "topics",
                        "sourceUrls",
                        "sourceLocators",
                        "relatedDocuments",
                        "supersedes",
                        "supersededBy",
                        "zeroTrustExcerpts",
                        "deadlines",
                        "changeHistory",
                      ].includes(k)
                    ? "array"
                    : "string",
          },
        ]),
      ),
    },
  };
  const prompt = `Extract a draft update for this PUBLIC federal document. Preserve identifiers and URLs. Do not infer Zero Trust: set it true only for an explicit textual match and quote exact excerpts with locators. Existing record:\n${JSON.stringify(item)}\nSource text:\n${text.slice(0, 700000)}`;
  estimatedInput += Math.ceil(prompt.length / 4);
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Title": "Federal Cyber Mandates Library updater",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Return only strict JSON grounded in the supplied public source.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        seed: 42,
        response_format: { type: "json_schema", json_schema: schema },
        provider: {
          require_parameters: true,
          data_collection: "deny",
          zdr: true,
          allow_fallbacks: false,
        },
      }),
    },
  );
  if (!response.ok)
    throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
  const payload = (await response.json()) as {
    choices: { message: { content: string } }[];
    usage?: { completion_tokens?: number };
  };
  estimatedOutput += payload.usage?.completion_tokens ?? 0;
  const parsed = mandateSchema.parse({
    ...JSON.parse(payload.choices[0]!.message.content),
    contentHash: hash,
    verifiedAt: new Date().toISOString().slice(0, 10),
    extractedText: text,
  });
  const excerptErrors = verifyZeroTrustExcerpts(parsed, text);
  if (excerptErrors.length) throw new Error(excerptErrors.join(" "));
  return parsed;
}
try {
  for (const index of indexes) {
    const res = await fetch(index, {
      headers: { "user-agent": "FederalCyberMandatesLibrary/1.0 updater" },
    });
    report.push(
      `- Discovery index ${index}: ${res.ok ? "reachable" : `HTTP ${res.status}`}`,
    );
  }
  for (const item of current) {
    const url = item.sourceUrls[0]!;
    if (!isOfficialSource(url)) throw new Error(`Disallowed source ${url}`);
    const response = await fetch(url, {
      headers: { "user-agent": "FederalCyberMandatesLibrary/1.0 updater" },
    });
    if (!response.ok)
      throw new Error(`${item.identifier}: HTTP ${response.status}`);
    const { text, hash } = await extract(response);
    if (hash === item.contentHash) {
      proposed.push(item);
      continue;
    }
    report.push(
      `\n## Changed: ${item.identifier}\n\n- Source: ${url}\n- Previous hash: \`${item.contentHash}\`\n- Proposed hash: \`${hash}\``,
    );
    proposed.push(await draft(item, text, hash));
  }
  const integrity = [
    ...findDuplicates(proposed),
    ...validateRelationships(proposed),
  ];
  if (integrity.length) throw new Error(integrity.join("\n"));
  report.push(
    "",
    "## Estimated OpenRouter usage",
    "",
    `- Input tokens: ${estimatedInput.toLocaleString()}`,
    `- Output tokens: ${estimatedOutput.toLocaleString()}`,
    "- Cost: calculate from the current selected provider prices shown by OpenRouter; model and provider rates can change.",
  );
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/proposed-mandates.json",
    JSON.stringify(proposed, null, 2) + "\n",
  );
  await writeFile("artifacts/change-report.md", report.join("\n") + "\n");
  if (JSON.stringify(proposed) !== JSON.stringify(current))
    await writeFile(
      "src/data/mandates.json",
      JSON.stringify(proposed, null, 2) + "\n",
    );
  console.log(`Checked ${current.length} records.`);
} catch (error) {
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/change-report.md",
    [
      ...report,
      "",
      "## Update failed safely",
      "",
      String(error),
      "",
      "The existing dataset was preserved.",
    ].join("\n"),
  );
  console.error(error);
  process.exit(1);
}
