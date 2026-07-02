import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import mandatesJson from "../src/data/mandates.json" with { type: "json" };
import { mandateCollectionSchema } from "../src/lib/schema";

const mandates = mandateCollectionSchema.parse(mandatesJson);
for (const item of mandates) {
  const response = await fetch(item.sourceUrls[0]!, {
    headers: { "user-agent": "FederalCyberMandatesLibrary/1.0 hash-seed" },
  });
  if (!response.ok)
    throw new Error(`${item.identifier}: HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  const hashInput =
    contentType.includes("pdf") || response.url.toLowerCase().endsWith(".pdf")
      ? body
      : body
          .toString("utf8")
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim();
  item.contentHash = createHash("sha256").update(hashInput).digest("hex");
  console.log(`Hashed ${item.identifier}`);
}
await writeFile(
  "src/data/mandates.json",
  `${JSON.stringify(mandates, null, 2)}\n`,
);
