# Contributing

Open an issue or branch for one coherent source or application change. Use official sources, explain authority/status choices, include exact locators for quotations, and update `verifiedAt` plus change history. Never classify Zero Trust by inference.

Before requesting review run:

```bash
npm run format:write
npm run lint
npm run typecheck
npm test
npm run validate:data
npm run check:sources
npm run build
```

Do not commit directly to `main` for weekly data updates. AI output is a draft and must be compared with the source by a human reviewer.
