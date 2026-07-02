# Federal Cyber Mandates Library Design

An independent, static-first React research application backed by version-controlled JSON. The default screen is a dense but calm research library with full-text search, faceted filters, sorting, shareable query-string state, and desktop split-view details that become routed full-page details on smaller screens.

The data contract distinguishes binding requirements, implementation directives, authoritative guidance, and supporting references. Zero Trust is opt-in only when exact source text contains the term and every excerpt passes programmatic normalized-text verification. The seed collection favors a smaller set of high-confidence federal sources over nominal completeness.

The weekly Node workflow discovers official pages, extracts HTML/PDF text, hashes content before any model call, validates strict structured output, and opens a pull request. Existing data is never replaced on failure. OpenRouter is server-side CI only and uses required-parameter and no-data-collection routing. Netlify deploys merges to `main`; the browser has no secret or model dependency.

Visual language follows the accepted concept at `C:/Users/steve/.codex/generated_images/019f2319-118b-7b82-9ed9-cac4628c9d90/exec-1f253f08-dfbf-4bdb-9250-e2367f95ef6f.png`: deep navy and slate, white research surfaces, amber Zero Trust treatment with icon and text, compact controls, table-oriented desktop results, and stacked mobile records.
