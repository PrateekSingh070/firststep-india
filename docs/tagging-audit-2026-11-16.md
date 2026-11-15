# FirstStep tagging audit — 16 November 2026

## Result

I manually reviewed a fixed sample of **50 existing posts** against freshly retrieved source evidence: **42 Unstop public API records and 8 original Internshala JobPosting pages**.

This is an **AI self-audit by the same Codex assistant that built the tagger**, not independent human validation or a benchmark of a pinned model.

| Metric | Clearly correct | Wrong / incomplete | Ambiguous | Clearly correct out of all 50 |
| --- | ---: | ---: | ---: | ---: |
| Broad role category | 48 | 1 | 1 | **96%** |
| City/location tag set | 47 | 1 | 2 | **94%** |
| Both fields together | 45 | 2 | 3 | **90%** |

Ambiguous cases are deliberately **not counted as correct** in those percentages. Excluding ambiguous cases, agreement is 48/49 = 98.0% for roles, 47/48 = 97.9% for location, and 45/47 = 95.7% jointly. The conservative all-50 figures are the headline result.

These are sample audit results, not proof of the same accuracy across the full dataset or future posts. The sample contains 10 of the 12 published role categories; Legal and Education were not represented among its published labels.

## Reproduce the sample and inspect every decision

- [50-post CSV with source links, published labels, review labels, verdicts and notes](audits/2026-11-16/reviewed-posts.csv)
- [Machine-readable audit, population IDs and sample metadata](audits/2026-11-16/audit.json)
- [Scorer and selection verification](audits/2026-11-16/score_audit.py)
- [Token-cost assumptions](audits/2026-11-16/cost-estimate.json)

Population: the 345 active posts returned by https://firststep-india.vercel.app/api/jobs, run ID `c7e184b1-3c05-4312-8781-2e3012ec8d40`, updated `2026-11-15T21:12:54.210Z` (16 November in IST).

Selection was fixed before scoring: sort SHA-256(`firststep-tag-audit-2026-11-16-v1|{jobId}`) ascending and take the first 50, without replacement. No failed or ambiguous post was swapped out. All 42 sampled Unstop records were found in fresh public API pages 1–4. The ordinary Unstop listing HTML was a JavaScript shell, so HTTP 200 on that shell was not treated as content verification. Internshala evidence came from original listing JobPosting data.

During the review, source titles, descriptions, structured locations and work arrangements were displayed without the existing role/city label columns. Expected decisions were saved before the comparison script ran. This reduces label anchoring but does not make a same-assistant review independent or fully blinded.

## Scoring rules

- **Role:** judge primary duties using the existing 12 broad categories, rather than copying the title. Payroll fits Finance, customer service fits Operations, and product coordination uses Operations because Product is absent from the taxonomy. This measures broad-category suitability, not exact job-title classification.
- **Location:** compare normalized complete location sets. Bangalore/Bangalore Urban → Bengaluru; Gurgaon → Gurugram; Delhi districts → Delhi; Borivali → Mumbai. Remote is a work-location category in the current UI, not a literal city.
- Explicit WFH metadata supports Remote when there is no mandatory local-presence requirement in the description. A role requiring availability for local visits is not safely pure-remote.
- Explicitly conflicting work-mode/location evidence is marked ambiguous instead of arbitrarily choosing the field that matches the existing tag.
- Unknown city remains Unspecified. Multiple source cities must be retained.
- This audit does not establish employer legitimacy, salary accuracy, fresher eligibility for every post, or whether every employer is still accepting applications.

## Errors and unresolved cases

| Sample | Finding | Why |
| --- | --- | --- |
| **6 — Robomanthan** | **Role error**: Sales & Business → Education | Despite the business-development title, the responsibilities focus on student training, workshops, assessments and monitoring progress. |
| **8 — Shooting Stars Foundation** | **Location incomplete**: Remote is too strong | The post requires availability for local college visits when needed. City is unspecified; it needs mixed remote/field treatment rather than a pure-remote promise. |
| **24 — Innovynex** | Location ambiguous | Metadata says hybrid in Addanki/Bellampalli; the description calls it remote. |
| **36 — Skorokryl** | Role ambiguous | The title and project-management tools suggest Operations, while the actual tasks emphasize academic research and writing. |
| **38 — Kovon** | Location ambiguous | Metadata says hybrid/Bangalore Urban; prose describes a remote internship and remote collaboration. |

The source links for every case are in the CSV. Another source inconsistency occurs in sample 48: hybrid metadata versus office-based prose. Pune itself is consistent, so it is not a city-tag error in this audit.

The practical fixes indicated by this review are to weight responsibilities more heavily than titles, separate city from work arrangement, and send conflicting source fields to review. The scores above use the captured pre-correction snapshot.

## Cost per 1,000 posts: actual cost is not measurable yet

The deployed pipeline does **not** make a separately metered LLM API call. It uses the model supplied to a scheduled cloud task. The code does not record the model ID, input/output/reasoning token counts, retries, agent tool usage, or task charges, and no billing ledger was available for this audit.

Therefore the honest actual number is **unknown, not $0**. The source collectors use public endpoints without a source API key, but that does not make cloud-task compute or hosting free.

### Explicit hypothetical API budget

To provide a useful planning number, I tokenized the 50 current candidate-shaped records using `o200k_base`, clipping descriptions to the same 2,200-character candidate limit and removing existing annotations. I also counted a compact JSON annotation output and amortized an explicit 136-token instruction across batches of 40.

This is a tokenizer-based simulation of a separate API implementation, **not captured model usage**:

| Item | Per 1,000 newly annotated posts |
| --- | ---: |
| Input text, including amortized instructions | 357,820 tokens |
| Visible JSON output | 20,840 tokens |
| Input at $0.20 / million | $0.071564 |
| Output at $1.20 / million | $0.025008 |
| **Single-pass visible-token subtotal** | **$0.096572 ≈ $0.10** |

The illustrative rates are the published [GPT-5.6 Luna API prices](https://developers.openai.com/api/docs/models/gpt-5.6-luna), checked on 16 November 2026. The current tagger is not configured to use this API model, and its classification quality was not evaluated in this audit. Account access to that model was not verified.

The estimate assumes uncached input, no billed reasoning, no retries, no extra agent history, no tool-call charges, and no chat-envelope overhead. It excludes collection, hosting, storage, browser traffic, the manual audit, and subscription costs. Additional reasoning/output tokens can dominate this small subtotal: 1,000 extra billable output tokens per post would add $1.20 per 1,000 at the same rate.

Current tags are reused for unchanged records, so 1,000 collected posts and 1,000 newly tagged posts are different workloads. A representative all-in cost needs measured cache-hit rate, model ID, all token categories, retries, task/runtime usage, storage and invoices.

To make the actual number reportable, the next implementation step is a pinned, metered tagging call with per-run usage and retry records, or equivalent usage/billing data exposed by the cloud-task platform.
