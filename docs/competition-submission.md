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

Hi, I’m Prateek. This is FirstStep India, a website that helps students and freshers find internships in India. It brings real listings into one place, removes duplicates and adds role and city labels. Here you can see the number of available posts and when the feed was last updated.

### 0:25–1:10

**Show:** Enter Python, SQL, React; show results; open one source detail

I’ll enter Python, SQL and React. The results update immediately, and each card shows which skills appear in the listing. I can filter by city, source, stipend and work arrangement. Opening a job shows its description and original link, so applicants can check the details before applying.

### 1:10–1:45

**Show:** Compare two listings; track one; show Applications

I can compare up to three jobs side by side. I can also save a job in Applications, update its stage, add a note and set a follow-up date. These records are saved in this browser. The app organizes the search; applications are submitted on the original job website.

### 1:45–2:35

**Show:** Evidence page, then GitHub architecture and checks

The app collects jobs from Unstop and Internshala. A daily task uses AI to label new or changed posts. Before publishing, it checks the labels, removes duplicates and requires at least two hundred posts. If an update fails, the previous successful feed stays available. Cloudflare stores the data, and Vercel hosts the website. Updates require authentication, and GitHub runs automated code checks.

### 2:35–3:25

**Show:** Working sheet: Submission and Reviewed posts; show rows 22 and 49

This sheet contains the job data and fifty review decisions with source links. The latest AI-assisted review found strict agreement of ninety-six percent for roles, ninety-two percent for locations and eighty-eight percent for both. Unclear cases count as non-matches. This is not independent human validation. The website keeps an older baseline; this sheet contains the latest review.

### 3:25–4:00

**Show:** Cost model, then AI tools and Prompts

I used Codex for help with coding, debugging and testing. The app also uses AI for role and city labels. The Prompts tab records the requests and tagging instructions. Using GPT-5.6 Luna pricing, the estimated API token cost is about nine cents per thousand new tags. This is an estimate, not the actual hosting or cloud-task bill.

### 4:00–4:35

**Show:** GitHub findings, then live site to close

One issue was that entering skills did not visibly change the job list. That is fixed: typing now filters and ranks the results, with a visible match count. The review also identified changed source text and unclear remote-work requirements. Next steps include independent human review and recording actual tagging costs. The submission links include the live app, this working sheet and the repository.

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
- Cost-estimate model: GPT-5.6 Luna. This names the illustrative pricing reference, not the deployed tagging model.
- Skills are term matches and the tracker is local to the browser.

Loom guidance: https://www.loom.com/screen-recorder and https://support.atlassian.com/loom/docs/share-your-recording-with-specific-people
