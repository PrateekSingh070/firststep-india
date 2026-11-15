# Product upgrade: explainable discovery and source-bound review

## What changed

The public Vercel app has three primary views: Discover, Applications, and Evidence.

Discover supports full-text AND search (including quoted phrases), city/source/arrangement/stipend/review filters, term-based skill overlap and sorting, comparison of up to three posts, shareable filtered URLs, and CSV export with spreadsheet-formula protection.

Applications keeps manual stages, notes and a follow-up date in the current browser. A tracked job snapshot remains available when a post disappears from the active feed. The tracker does not submit applications or schedule reminders.

Evidence exposes live collection health through a read-only status adapter, source counts and the persisted run ID. It includes the original 50-post audit and CSV, conservative baseline scores, applicable corrections, unresolved cases, and the existing cost/model limitations. This dashboard loads separately from the initial discovery bundle.

## Source-bound review

web/lib/review-records.json contains review decisions and a SHA-256 fingerprint of each audited source input: title, company, raw location, raw mode, and description.

web/lib/feed.js applies a decision only to the identical source version. It preserves raw source metadata and adds tagReview evidence. Changed inputs receive a re-review notice and retain their source tags.

Two clear corrections currently apply:
- Robomanthan's training duties move its role from Sales & Business to Education.
- Shooting Stars' local-visit requirement moves it out of pure-remote discovery and into Remote + local visits, with city unspecified.

Four records need review: the three original ambiguous cases plus the separately noted arrangement conflict in sample 48. This does not revise the original baseline scores.

The review layer does not rewrite R2 snapshots or inflate audit accuracy. It is a transparent read model over the unchanged collector dataset.

## Technical boundaries

- Vercel API routes are GET-only and validate upstream records/source hosts.
- Expired, unsafe or malformed records are excluded.
- Skills and notes stay in the browser; no private profile is sent to an LLM.
- Skill matches are literal term overlap, not hiring probabilities.
- Actual model/cost metering and scheduler-execution visibility remain explicit limitations.

## Verification

web/tests/product.test.mjs tests correction expiry on every source field, mixed/ambiguous arrangements, feed validation, CSV safety, literal matching, read-only API methods and upstream failures. Original collector tests cover staged publication, tag validation, last-good preservation, expiry, deduplication, authorization and concurrency.

GitHub Actions runs web checks/build, collector tests and deterministic sample verification. Browser QA covers matching, comparison, tracking/persistence/notes/follow-up dates, mobile navigation, corrected tags and live evidence.
