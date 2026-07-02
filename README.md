# Federal Cyber Mandates Library

An independent, analyst-oriented research aid for federal cybersecurity mandates and authoritative guidance published since 2010. It is not an official government system and does not provide legal advice. Always verify a requirement against its authoritative source.

## Architecture

The browser is a React, TypeScript, and Vite SPA. It reads version-controlled JSON validated with Zod; there is no database, account system, runtime AI call, or frontend secret. Pure modules own search, URL state, source policy, excerpt validation, duplicate detection, and relationships. GitHub Actions reviews source changes; Netlify deploys reviewed merges.

## Local development

Requires Node 22 or newer.

```bash
npm ci
npm run dev
```

Quality commands: `npm test`, `npm run lint`, `npm run typecheck`, `npm run format`, `npm run validate:data`, `npm run check:sources`, and `npm run build`.

## Data schema and editing

The Zod source of truth is `src/lib/schema.ts`; records live in `src/data/mandates.json`. Required fields cover identity, authority, type, dates, status, summaries, requirements, deadlines, applicability, organizations, topics, Zero Trust evidence, sources, relationships, verification, SHA-256 content hash, extracted source text, and change history.

Edit only from an official source. Keep requirements close to source language without presenting summaries as quotations. Set `authorityLevel` to one of:

- `binding-requirement`: compulsory within the instrument's stated jurisdiction and scope.
- `implementation-directive`: executive-branch operational direction, typically OMB.
- `authoritative-guidance`: federal standards or guidance that are not universally binding by themselves.
- `supporting-reference`: authoritative context without a direct mandate.

Run `npm run refresh:hashes` only after intentionally reviewing source changes, then run the full quality suite. See [data quality](docs/data-quality.md) and [contributing](CONTRIBUTING.md).

## Zero Trust classification

`zeroTrust` may be true only if the authoritative source explicitly contains “Zero Trust” or a verified typographic variant. Each record needs an exact excerpt and locator. Validation normalizes whitespace and dash variants, confirms the phrase, and proves the excerpt exists in `extractedText`. No semantic inference is allowed.

## Weekly discovery and human review

The Tuesday workflow parses the maintained OMB memorandum index, CISA directive index, and NIST final-publications index, then compares discovered identifiers and canonical URLs with the collection. It monitors every matching OMB/CISA entry and the ten newest matching NIST publications per run. An index that becomes unreachable or yields no parseable document links fails closed instead of silently reporting success. The workflow downloads new and changed HTML/PDF content, hashes content before AI, skips unchanged records, and calls OpenRouter only for new or changed material. Output must pass the Zod schema, official-domain policy, exact Zero Trust excerpt verification, duplicate detection, and relationship checks. Failure preserves the existing dataset and writes a job summary/artifact.

Changes open as a **draft pull request**, never as a direct production commit. The report includes sources, old/new hashes, proposed JSON, validation results, Zero Trust matches, warnings, and estimated token use. Reviewers use [the checklist](docs/reviewer-checklist.md); merging is the publication decision and triggers Netlify.

## OpenRouter setup and model replacement

Create the GitHub Actions secret `OPENROUTER_API_KEY` and repository variable `OPENROUTER_MODEL`. The fallback is `qwen/qwen3.5-27b`. On July 2, 2026, OpenRouter advertised a 262K context window, response-format support, and zero-retention providers for that model. Headline pricing was approximately $0.195/M input and $1.56/M output, but provider rates change.

The request uses temperature `0`, seed `42`, strict JSON schema, `require_parameters`, `data_collection: deny`, zero-data-retention routing, and no provider fallback. It fails if those privacy/parameter constraints cannot be satisfied. Only downloaded public federal document text is transmitted—never secrets, repository metadata, or reviewer information.

To replace the model, compare the live [OpenRouter model catalog](https://openrouter.ai/models) for context, `response_format`, provider retention, input/output price, and availability; update only the `OPENROUTER_MODEL` repository variable. Estimate each review using the report's token counts and the selected provider's current per-million-token prices.

## Netlify deployment

`netlify.toml` builds with `npm run build`, publishes `dist`, restores SPA routes, applies security headers, caches hashed assets immutably, and revalidates HTML/data quickly. No OpenRouter variable is configured on Netlify and no `VITE_` secret exists.

For a new site: `npx netlify init`, choose the GitHub repository and `main`, then `npx netlify deploy --prod`. Merges to `main` subsequently deploy through continuous deployment.

## Troubleshooting and security

- A source check failure is a data-quality failure; update or remove the record instead of bypassing it.
- A changed hash without an API key fails safely and leaves current JSON intact.
- A Zero Trust excerpt failure means the exact text/locator must be corrected from the source.
- Never commit `.env`, keys, extracted private material, or generated AI output that has not been reviewed.
- Dependency and workflow changes require the same pull-request checks as data changes.

See [source allowlist](docs/source-allowlist.md) and [security policy](SECURITY.md).
