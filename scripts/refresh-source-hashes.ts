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
  item.contentHash = createHash("sha256")
    .update(Buffer.from(await response.arrayBuffer()))
    .digest("hex");
  console.log(`Hashed ${item.identifier}`);
}
await writeFile(
  "src/data/mandates.json",
  `${JSON.stringify(mandates, null, 2)}\n`,
);
