# Competition walkthrough — 90 seconds

Position FirstStep as **an early-career discovery workspace with evidence you can inspect**. Show working behavior before describing the infrastructure.

## 0–20 seconds: find a useful opportunity

Open https://firststep-india.vercel.app.

- Show the real active count and collection timestamp.
- Add React, TypeScript under Your skills.
- Search Mystical and open the full-stack role.
- Show the two matched terms and original source description. These are explainable term matches, not an eligibility score.

## 20–40 seconds: make a decision and a next step

- Search developer, select two Compare checkboxes, and compare stipends, arrangements, deadlines and matching terms.
- Track an opportunity and demonstrate its stages. The app does not submit applications.
- Add a note/follow-up date, reload, and show persistence.
- Explain that applications and skills stay in this browser; CSV export is the backup path.

## 40–70 seconds: make quality tangible

- Open Evidence and inspect all 50 audit rows.
- Explain the 96% role / 94% location / 90% joint conservative baseline and self-review limitation.
- Search Robomanthan to show the reviewed Education correction and its original Sales tag.
- Show Needs review for conflicting source fields.
- Explain that a source-input fingerprint invalidates an old correction when source content changes.

## 70–90 seconds: show the working pipeline

- Show live R2 status, persisted run ID, last successful collection, and source counts.
- Describe authenticated writes, all-tags / 200-post gate, last-good preservation and conditional concurrent publication.
- Open the Product checks workflow: web regression tests, TypeScript, production build, collector tests and deterministic audit verification.

## State the boundaries clearly

The public web tier runs on Vercel; collection/storage remain on Cloudflare/Sites. The scheduled cloud task supplies the LLM. Skills use deterministic term overlap; the tracker is device-local; reviewed corrections apply at read time.

The daily schedule is configured; an unattended run was not observed in the original verification. GPT-5.6 Luna is the cost-estimate model. Actual cloud-task cost is unmetered. The ~$0.10/1,000 number is a hypothetical visible-text API token subtotal, not actual spend. Employer legitimacy is not independently verified.

## Reproduce the checks

Use Node 24. In web/, run npm ci followed by npm run check.

From the repository root, run node --test collector/tests/pipeline.test.mjs and python docs/audits/2026-11-16/score_audit.py.
