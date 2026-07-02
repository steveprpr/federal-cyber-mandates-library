import mandates from "../src/data/mandates.json" with { type: "json" };
import { mandateCollectionSchema } from "../src/lib/schema";
import {
  findDuplicates,
  isOfficialSource,
  validateRelationships,
  verifyZeroTrustExcerpts,
} from "../src/lib/validation";

const parsed = mandateCollectionSchema.parse(mandates);
const errors = [...findDuplicates(parsed), ...validateRelationships(parsed)];
for (const item of parsed) {
  for (const url of item.sourceUrls)
    if (!isOfficialSource(url))
      errors.push(`${item.identifier} has a non-official source: ${url}`);
  errors.push(
    ...verifyZeroTrustExcerpts(item, item.extractedText).map(
      (error) => `${item.identifier}: ${error}`,
    ),
  );
}
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Validated ${parsed.length} records; ${parsed.filter((x) => x.zeroTrust).length} explicitly reference Zero Trust.`,
);
