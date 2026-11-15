# What broke, what was fixed, and what was verified

These notes distinguish observed failures from risks found during the audit.

| Issue | Evidence / cause | Fix |
| --- | --- | --- |
| Unstop returned HTTP 403 during the initial collector probe | Requests without the working collector User-Agent failed; subsequent requests with it succeeded. | Consistent User-Agent and bounded request timeouts. This does not guarantee future source access. |
| Non-internship promoted cards appeared in Internshala results | The listing page mixed card types. Treating every card as an internship admitted unrelated promoted jobs. | Require the internship employment-type attribute before accepting a card. |
| Remote work and location aliases were mishandled initially | Unstop used `wfh`, not the initially assumed `work_from_home`; missing city fields were common. | Interpret explicit work mode, normalize city aliases, preserve multiple locations, and retain Unspecified when location is missing. |
| One manual refresh timed out before publication completed | Collection/tagging/publication were combined in a 60-second execution. The client execution was canceled while publication was underway; the prior snapshot remained. | Split collection, tagging batches, publication and readback into separate bounded calls. Retry the same staged run; publication is idempotent. A later complete protected refresh was verified. |
| Public maintenance routes lacked their own authorization after access became public | The original build relied on the owner-private Sites gate. The audit found the audience had become public. The old assumption was no longer valid. | Add explicit updater-token verification to all maintenance routes; preserve public read access. Production tests returned 401 for anonymous writes and accepted the valid updater credential. |
| Concurrent publishers could pass an early revision check together | Code review found a check-then-write window before replacing the snapshot. This was an audit finding, not an observed production overwrite. | Use an R2 ETag conditional write. A concurrency test verifies that one publisher succeeds and the other receives 409. |
| Bookmarks could fail when browser storage was unavailable or malformed | Code review found an unguarded localStorage write and an unchecked stored JSON value. | Guard storage reads/writes and accept only arrays of string IDs. The current session still works if persistence is unavailable. |
| Dialog keyboard behavior was incomplete | Code review found Escape support without a Tab boundary. | Add Tab/Shift+Tab focus containment and lock background scrolling while the dialog is open. |
| Browser requested a missing favicon | Production logs included favicon 404s. | Add the FirstStep SVG favicon to document metadata. |
| The original public URL was unacceptable to the user | The first deployment used a `chatgpt.site` hostname. | Move the public web tier to https://firststep-india.vercel.app and add a read-only server-side data adapter. Collection/storage remain on Cloudflare/Sites. |
| Alternative hosting and login attempts failed | AppDeploy could not verify deployment availability; its deployment did not start. Vercel's saved CLI token was invalid. | Stop the unavailable hosting attempt, prepare a Vercel build, complete user sign-in, then publish successfully. No AppDeploy app is part of the deployed architecture. |

## Verification completed

- Collector API tests: missing annotations, invalid tags, incomplete sources, minimum count, expiry, deduplication, idempotency, stale-run rejection, origin checks, unauthorized maintenance access, and concurrent publishers.
- TypeScript checks and production builds for the deployed code.
- Real live refresh through protected collect → LLM tag → publish → persisted readback.
- Latest observed production readback: **345 active posts**, each with role and city tags, matching the current R2 run ID.
- Vercel page/API returned HTTP 200 and the same live dataset.
- Vercel adapter: read-only method guard and simulated upstream failure handling.
- Browser checks: search, combined filters, bookmarking, detail dialog, source links, and mobile layout bounds.

## What was not established

- A completed unattended scheduled run was not observed. The daily schedule is enabled and its underlying manual workflow was verified.
- The exact LLM model/version is not pinned. A cloud-task execution supplies the model.
- Every employer and every individual application link was not independently verified.
- There is no guarantee that external source formats/access will remain stable.
- GitHub pushes do not currently trigger deployment to Vercel or Sites.
