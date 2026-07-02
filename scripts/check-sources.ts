import mandates from "../src/data/mandates.json" with { type: "json" };
import { mandateCollectionSchema } from "../src/lib/schema";
import { isOfficialSource } from "../src/lib/validation";

const failures: string[] = [];
for (const item of mandateCollectionSchema.parse(mandates))
  for (const url of item.sourceUrls) {
    if (!isOfficialSource(url)) {
      failures.push(`${item.identifier}: source is outside allowlist: ${url}`);
      continue;
    }
    try {
      let response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "user-agent": "FederalCyberMandatesLibrary/1.0 source-check",
        },
      });
      if (!response.ok)
        response = await fetch(url, {
          redirect: "follow",
          headers: {
            "user-agent": "FederalCyberMandatesLibrary/1.0 source-check",
            range: "bytes=0-1023",
          },
        });
      if (!response.ok)
        failures.push(`${item.identifier}: HTTP ${response.status} ${url}`);
      else console.log(`OK ${response.status} ${item.identifier} ${url}`);
    } catch (error) {
      failures.push(`${item.identifier}: ${String(error)} ${url}`);
    }
  }
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
