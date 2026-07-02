# Federal Cyber Mandates Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, publish, deploy, and browser-verify a source-grounded federal cybersecurity research library.

**Architecture:** A React/Vite SPA consumes schema-validated local JSON. Focused pure modules own search, URL state, validation, and source integrity; scripts own weekly discovery and OpenRouter draft extraction; GitHub Actions and Netlify own review and release boundaries.

**Tech Stack:** React, TypeScript, Vite, Zod, Vitest, Testing Library, GitHub Actions, OpenRouter API, Netlify.

---

- [ ] Write and run failing contract/search/integrity tests.
- [ ] Implement the schema, query engine, URL state, and integrity validators.
- [ ] Seed and validate authoritative federal records.
- [ ] Implement accessible library, detail, methodology, and responsive states.
- [ ] Add source checker, weekly updater, strict OpenRouter routing, and PR report.
- [ ] Add CI, Netlify configuration, documentation, contributor and reviewer guidance.
- [ ] Run tests, lint, format, typecheck, source checks, accessibility checks, and production build.
- [ ] Publish to GitHub, connect Netlify, deploy production, and verify desktop/mobile behavior.
