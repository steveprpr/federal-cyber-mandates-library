# Data-quality methodology

## Selection

Start with major cross-government cybersecurity instruments and stable official publication pages. Prefer a smaller verified record set to a broad catalog with uncertain status. A missing stable official document is omitted and logged for follow-up.

## Verification

Review the source instrument, not a search snippet. Record publication/effective dates separately, distinguish current from historical deadlines, and state the affected population narrowly. Status changes need explicit source evidence. SHA-256 hashes track downloaded source bytes; `verifiedAt` records the last human/source review.

## Summaries and authority

Summaries explain practical effect but are not quotations. Binding status depends on the instrument and its stated scope. NIST guidance is not labeled binding merely because another mandate incorporates it for a specific population.

## Zero Trust

Designation requires an explicit textual match, an exact excerpt, a locator, and automated containment verification against extracted source text. Color is supplemented by the shield icon and `ZERO TRUST` text.

## Change control

Automation discovers and drafts; it does not publish. Hash before AI, skip unchanged documents, validate structured output, preserve current data on failure, and open a draft PR. Human review and merge are mandatory.
