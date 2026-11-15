# FirstStep India

[Live job board](https://firststep-india.vercel.app) · [Architecture](docs/architecture.md) · [What broke and how it was fixed](docs/incidents.md)

FirstStep collects real public internship posts in India, removes duplicates, applies LLM role/city annotations, and presents them in a searchable board. Production readback on 16 November 2026 confirmed **345 active, fully tagged listings** from Unstop and Internshala.

## Product workspace

Discover now includes explainable skill matches, side-by-side comparison, shareable filters, safe CSV export and source-bound review badges. Applications adds device-local stages, notes and follow-up dates. Evidence shows live collection health, audit rows, corrections and unresolved cases. [Upgrade details](docs/product-upgrade.md) · [90-second competition walkthrough](docs/competition-demo.md).

GitHub Actions runs web regression tests, type checks, the production build, collector tests and audit verification.

## Tagging quality audit

A reproducible 50-post self-audit found 48 clearly correct role tags, 47 clearly correct location tag sets, and 45 posts with both clearly correct. Ambiguous cases are counted separately. Actual cloud-task cost per 1,000 is not instrumented; the report separates that gap from an illustrative API token budget. [Read the complete audit](docs/tagging-audit-2026-11-16.md).

## Repository layout

- `web/`: the deployed React/Vite frontend, plus the read-only Vercel Function in `web/api/jobs.js`.
- `collector/`: the Cloudflare Workers/Vinext service, public-source collectors, R2 snapshot workflow, initial dataset, and pipeline tests. Its original Sites deployment metadata and build helpers are retained.
- `docs/`: architecture, incident notes, and the daily updater instructions.

The frontend includes search, role/city/source/remote/stipend filters, sorting, pagination, source links, details, and bookmarks stored on the current device.

## Where the parts run

| Component | Host |
| --- | --- |
| Public website and read-only API adapter | Vercel — https://firststep-india.vercel.app |
| Collection and maintenance API | Cloudflare Workers, provisioned through Sites |
| Job snapshots and staged annotations | Cloudflare R2 |
| Daily collection and LLM tagging | Linked scheduled cloud task, 07:00 Asia/Kolkata |

The move to Vercel changed the public web tier. The existing collector endpoint still uses a `chatgpt.site` hostname internally. This is **not** a full migration away from Sites.

## Run locally

Use Node 24.13+.

```sh
cd web
npm ci
npm run dev
```

The Vite development proxy reads the production public job feed. It does not expose maintenance credentials.

```sh
cd web
npm run build
node node_modules/typescript/bin/tsc --noEmit
```

The collector API tests use Node's test runner and an in-memory R2 implementation:

```sh
node --test collector/tests/pipeline.test.mjs
```

To run the entire collector's local preview, install its dependencies separately and run `npm run dev` inside `collector/`. Its local R2 state is separate from production.

The Vercel API applies reviewed corrections only to identical source versions and flags changed inputs for re-review. Original R2 source snapshots are preserved. The pre-correction audit remains the baseline.

## Refresh and model behavior

The cloud task fetches fresh public posts through `POST /api/collect`, retrieves new/changed candidates, uses its LLM to assign role and city tags, and saves validated annotations through `POST /api/tag`. `POST /api/publish` checks all tags and the minimum count, deduplicates, then conditionally replaces the latest R2 snapshot.

**There is no OpenAI/Gemini API integration or pinned model in the Worker or Vercel application.** Initial annotations were authored by the Codex LLM. Daily annotations use the model supplied by the scheduled cloud task. Exact model/version selection is not pinned by this repository.

A complete manual refresh was exercised and persisted. The daily schedule is enabled; a completed unattended scheduled run was not observed as part of the original verification.

## Security

Public users can read job data. Every maintenance endpoint requires `X-FirstStep-Update-Token`. The worker SHA-256 hashes that token and compares it with the `UPDATE_TOKEN_SHA256` runtime secret.

The task retrieves the existing Site-scoped service token from the native Sites tool. No token is stored in this repository, the browser, Vercel, or the schedule prompt. If that token rotates, update its verification digest through Sites and redeploy the collector. The repository contains only the secret's **name**.

Public API adapter routes are GET-only. Snapshot replacement uses an R2 ETag precondition so competing publishers cannot overwrite each other's newer results.

## Deploying and ownership

- Vercel: deploy `web/` with `vercel deploy --prod` after signing into the intended account.
- Collector: the current deployment is managed through the Sites source/build/publish workflow. Its existing project ID is retained in `collector/.openai/hosting.json`. Use that ID to update the existing service; provision a separate Site for an independent deployment.
- The production schedule is managed by the linked cloud task, not a Vercel Cron or GitHub Actions job. See [updater instructions](docs/daily-updater.md).
- This GitHub repository is a combined source snapshot. Pushing it does **not** automatically deploy either host until a Git integration is explicitly configured.

## Limits

Source availability is checked at collection time; employer legitimacy and every individual application page are not independently verified. Listings without a deadline may close between collections. Source markup/APIs may change or block automation. LLM tags can be wrong. Deduplication can merge indistinguishable requisitions with the same company/title/location. Bookmarks are local to the browser origin and do not migrate automatically between domains.

Failed/incomplete collection preserves the previous snapshot. Known expired deadlines are hidden on each read. The board marks the snapshot overdue after 36 hours. The 200-post threshold is a publication guard, not a promise that the active count can never drop below 200 between updates.
