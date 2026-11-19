# FirstStep submission and Loom recording guide

## Submit these links

- Product: https://firststep-india.vercel.app
- Working sheet: https://docs.google.com/spreadsheets/d/1OKOd_ZQoaYNwI9sOyNGLD7ys58WEONCrgWbBTAMLd9k/edit
- Loom: record your own face and screen, then paste its share link.
- Optional repository: https://github.com/PrateekSingh070/firststep-india (private; judges need access).

## Before recording

1. Use Loom screen-and-camera mode. Turn on your microphone and keep your face visible.
2. Target 4 minutes 35 seconds, leaving 25 seconds below the five-minute limit.
3. Open the live app, working sheet and GitHub checks in separate tabs. Rehearse the clicks once.
4. Read the live count rather than promising a fixed count. Listings change daily.
5. Prepare Python, SQL, React as demo skills. If fewer than two matching listings remain, compare two other active posts.
6. Remember: the website Evidence panel is the older November 16 baseline. Use this sheet and the November 19 GitHub report for the latest audit.

## Suggested script

### 0:00–0:25

**Show:** Live website home

Hi, I’m Prateek. This is FirstStep India, a live internship discovery tool for people starting their careers in India. I built it with Codex assistance. It collects real public listings, removes duplicates, uses an LLM to tag roles and cities, and presents a searchable board. The count and collection time shown here come from the saved feed.

### 0:25–1:10

**Show:** Enter Python, SQL, React; show results; open one source detail

I’ll enter Python, SQL and React. The results now filter and rank immediately, and each card explains which terms matched. This is deterministic term matching, not an AI eligibility score. I can also filter by city, source, stipend and work arrangement. Opening a listing shows the original source link and description, so applicants can verify requirements themselves.

### 1:10–1:45

**Show:** Compare two listings; track one; show Applications

I can compare up to three listings to inspect stipend, location, deadlines and skill terms side by side. Tracking a listing adds it to Applications, where I can update the stage, write notes and set a follow-up date. These records stay on this browser and device. The tool helps organize the search; it does not submit applications.

### 1:45–2:35

**Show:** Evidence page, then GitHub architecture and checks

The pipeline collects from the Unstop API and Internshala pages. The scheduled cloud task tags new or changed posts. Publication checks complete tags, removes duplicates and requires at least two hundred posts. Cloudflare R2 stores the last successful snapshot. Failed refreshes preserve that snapshot, and conditional writes protect concurrent updates. Vercel serves the public website. Maintenance writes require authentication. GitHub Actions runs the product tests, type checks, build, collector tests and audit verification.

### 2:35–3:25

**Show:** Working sheet: Submission and Reviewed posts; show rows 22 and 49

Here is the working sheet with the job snapshot, all fifty review decisions, sources, tools and prompts. The latest November nineteenth AI self-review found strict agreement of ninety-six percent for role, ninety-two percent for location and eighty-eight percent for both. Ambiguities remain in the denominator. Two differences are normalization choices, and one source changed after collection. This is not independent human validation. The website’s older evidence panel preserves the November sixteenth baseline separately.

### 3:25–4:00

**Show:** Cost model, then AI tools and Prompts

The estimated separate API token subtotal is about nine cents per thousand newly tagged posts. That is not measured production spend. The deployed cloud task does not expose its exact model or billable usage. This sheet shows the assumptions and formulas, and distinguishes exact user requests and recorded runtime instructions from a documented workflow. I have not claimed access to hidden prompts or billing records.

### 4:00–4:35

**Show:** GitHub findings, then live site to close

A real usability issue was that entering skills originally left the newest-first list unchanged. I fixed it so typing immediately filters and ranks jobs, with a visible match count. The audit also shows why source drift and remote-versus-local requirements need review. Reviewed corrections are tied to source fingerprints so changed inputs invalidate old reviews. My next priorities are independent human validation and pinned, metered model calls. The live tool, repository and working evidence sheet are linked in my submission.

## After recording

- Title: FirstStep India | Live internship discovery, pipeline and evidence.
- Confirm final duration is under 5:00, face and screen are visible, and audio is clear.
- Set the Loom link so your judges can view it. Paste it into the sheet Submission tab B5.
- Set the Google Sheet to Anyone with the link / Viewer, or add the judges explicitly.
- Check the product, Loom and sheet links from an incognito/signed-out window.

## Copy-paste submission

Project: FirstStep India
Live product: https://firststep-india.vercel.app
Loom, face + screen, under 5 min: [PASTE YOUR LOOM LINK]
Working data, AI tools and prompts: https://docs.google.com/spreadsheets/d/1OKOd_ZQoaYNwI9sOyNGLD7ys58WEONCrgWbBTAMLd9k/edit
Repository (optional): https://github.com/PrateekSingh070/firststep-india

FirstStep collects real India internship listings from Unstop and Internshala, removes duplicates, tags roles and cities using a scheduled LLM task, and serves a searchable workspace. It includes explainable skill matching, comparison, a device-local application tracker, durable snapshots and automated checks. The working sheet contains the captured job data, 50 source-by-source AI review decisions, cost assumptions and prompt provenance.

## Claims to keep accurate

- Latest strict AI self-review: 96% role, 92% location, 88% jointly. Not independent human validation.
- Hypothetical separate API token subtotal: $0.093412 per 1,000 newly tagged posts. Actual cloud-task cost is unmeasured.
- The exact production model is not exposed. The pricing example does not identify it.
- Skills are term matches and the tracker is local to the browser.

Loom guidance: https://www.loom.com/screen-recorder and https://support.atlassian.com/loom/docs/share-your-recording-with-specific-people

