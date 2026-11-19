# FirstStep: 50-post tagging review and cost per 1,000

**Reviewed 19 November 2026. Strict agreement: role 48/50 (96%), location 46/50 (92%), both 44/50 (88%). Estimated separate API token subtotal: $0.093412 per 1,000 newly tagged posts. Actual deployed cost: unmeasured.**

This is an individual, source-by-source **AI self-review by Codex**, not a human hand-check or independent human validation. It evaluates the tags shown on the published board, including its existing review corrections, against fresh original-source evidence. It is not a benchmark of a pinned model, which the deployed cloud task does not expose.

## Results

| Field | Exact, clearly correct | Wrong against current source | Normalization difference | Ambiguous | Strict agreement |
| --- | ---: | ---: | ---: | ---: | ---: |
| Role category | 48 | 1 | 0 | 1 | **96%** |
| City/location set | 46 | 1 | 2 | 1 | **92%** |
| Both fields together | 44 | 2 | 2 | 2 | **88%** |

All 50 remain in every denominator. Ambiguity and normalization disagreements do not count as strict matches. The two normalization differences retain source-supported reference cities alongside Remote; they are **not established factual errors**. Accepting those representations gives location agreement 48/50 (96%) and joint agreement 46/50 (92%). The strict numbers remain the headline.

The one role mismatch is a source-freshness issue: the source changed from HR to UI/UX after the stored snapshot. It is a current user-facing mismatch, not evidence that the original classifier misread the old HR description. Thus, the two clearly mismatched posts comprise one changed-source role and one remote/presence conflict.

Approximate 95% Wilson intervals for the strict proportions are 86.5–98.9% for role, 81.2–96.8% for location and 76.2–94.4% jointly. These describe sampling uncertainty only; they do not correct reviewer subjectivity, temporal drift, source dependence or systematic bias. A sample of 50 does not establish dataset-wide production accuracy.

## What was actually reviewed

- Population: **347 active published listings**, snapshot run `3ec15a16-a4f5-4d83-9f0e-5ab8341092ed`, collected `2026-11-19T01:28:13.624Z` (06:58 IST).
- Fixed selection: sort SHA-256(`firststep-tag-audit-2026-11-19-v1|{jobId}`) ascending and take the first 50 without replacement. No difficult or changed post was replaced.
- Source evidence: **42 Unstop public API records and 8 original Internshala JobPosting pages**. All 50 were retrieved successfully at approximately 14:08 IST on 19 November.
- All 50 source descriptions, structured locations and arrangements were read individually. Expected role/location decisions were saved before comparison with the published labels. The reviewer had prior project context, so this is not a fully blind or independent evaluation.
- Five sampled IDs overlap the [16 November audit](tagging-audit-2026-11-16.md). Four already carry reviewed badges and one carries a correction. This is a fresh sample of the published board, **not an untouched holdout set** or proof of improvement since the earlier audit.
- The archived decisions were not used to retag these posts or revise this snapshot's scores. The website's Evidence view still labels the original 16 November baseline separately.

## Rubric

Judge primary responsibilities using the existing 12 broad categories, not employer industry or title alone. Recruitment is HR; customer service and routine catalog data entry are Operations; software QA is Software & IT; teaching AI tools is Education; mechanical CAD and architectural drawings are Engineering. Product coordination uses Operations because the taxonomy has no Product category. Brand content and campaign analytics use Marketing. Where duties do not establish a clear primary category, mark ambiguity.

Compare normalized complete location sets: Bangalore → Bengaluru, Gurgaon → Gurugram, Mumbai localities → Mumbai. Preserve multiple placement cities. Remote is a work-location label in the current UI, not a literal city. For this strict review, a fully remote position uses Remote; an additional source-supported reference city is recorded as a normalization difference rather than a proven factual error. A city for a hybrid role remains relevant. Employer headquarters, nationwide service areas and incidental cities are not job locations. Required local presence prevents a pure-remote conclusion; uncertain campus-presence requirements remain ambiguous. Missing city uses Unspecified.

This checks **role and city/location tags only**. It does not certify employers, compensation, whether every post accepts freshers, application availability, or work-arrangement tags as a separate scored field.

## Every non-exact case

| Row | Post | Published → reviewed | Finding |
| --- | --- | --- | --- |
| 14 | [ROI Boosters, PPC](https://unstop.com/internships/ppc-internship-roi-boosters-1817656) | Gurugram + Remote → Remote | WFH and remote prose agree. Gurgaon exists in structured metadata. **Normalization difference**, not an established fabricated city. |
| 22 | [Cognirex, formerly HR](https://unstop.com/internships/human-resource-hr-internship-cognirex-solutions-1810417) | HR → Design & Creative | Current title and duties are UI/UX design; the old HR URL remains. **Source changed after snapshot**. |
| 23 | [Nexovate, Campus Ambassador](https://unstop.com/internships/campus-ambassador-nexovate-private-limited-1813519) | Remote → ambiguous | WFH metadata coexists with campus-level activities; physical attendance is unclear. |
| 31 | [Nishkarsh, Data Entry](https://unstop.com/internships/data-entry-operator-internship-nishkarsh-it-solution-private-limited-1815867) | Noida + Remote → Remote | WFH metadata also provides Noida. **Normalization difference**, not an established fabricated city. |
| 35 | [Network FP, Sales Consultant](https://unstop.com/internships/sales-consultant-internship-network-fp-1804349) | Sales & Business → ambiguous | Member eligibility, documentation and service overlap with renewal/conversion duties; Operations versus Sales is unclear. |
| 49 | [MyCaptain, Law Campus Ambassador](https://unstop.com/internships/law-campus-ambassador-internship-mycaptain-1802578) | Remote → Unspecified | Campus gatherings and offline community duties conflict with a pure-remote promise. City is missing; confirm presence requirements. |

Useful follow-ups: store reference city separately from required work city, recheck source changes more frequently than daily where needed, and route contradictory presence requirements to review. These are findings, not claims that all proposed fixes have already shipped.

## Cost per 1,000 posts

### Actual deployed spend: unknown, not zero

The current scheduled cloud task supplies its LLM. The repository does not pin its model or record billable token categories, retries, tool usage and platform charges. No invoice or billing ledger was available. Therefore **there is no defensible measured actual $/1,000 figure yet**.

### Hypothetical separate API implementation: $0.093412 ≈ $0.09

The captured 50 published records were projected to the collector's source fields, removing annotations and UI enrichment. Descriptions were clipped to its 2,200-character candidate limit. `o200k_base` was used as a token-count proxy. Output is compact JSON containing IDs, role tags and city arrays. A 136-token instruction is amortized over 40-post batches. This measures text size, not an actual inference call or its accuracy.

| Component | Per 1,000 newly annotated posts |
| --- | ---: |
| Input tokens: 16,919 / 50 × 1,000 + 136 × 25 batches | 341,780 |
| Visible output tokens: 1,044 / 50 × 1,000 | 20,880 |
| Input at $0.20 / million | $0.068356 |
| Output at $1.20 / million | $0.025056 |
| **Single-pass visible-token subtotal** | **$0.093412** |

Illustrative [GPT-5.6 Luna standard text rates](https://developers.openai.com/api/docs/models/gpt-5.6-luna) were checked on 19 November 2026. **That is not the confirmed deployed model, and its tagging quality was not tested here.** Account/model access was not verified.

This excludes billed reasoning, retries, agent history and tools, chat framing, collection, hosting, storage, subscriptions and human review. At the same output rate, an additional 1,000 billable output/reasoning tokens per post adds **$1.20 per 1,000 posts**. A 10% retry overhead on identical calls would make the visible-token subtotal approximately $0.102753. Neither is measured spend.

The pipeline reuses tags for unchanged posts. Therefore 1,000 collected posts and 1,000 newly annotated posts are different workloads. To report actual cost, pin the provider/model and log all billable usage and retries; reconcile run costs with the invoice and separately allocate runtime/storage expenses. For a measured run: `actual cost per 1,000 = attributable run cost / newly tagged posts × 1,000`.

## GitHub evidence and reproduction

- [All 50 rows as CSV](audits/2026-11-19/reviewed-posts.csv): source links, published/expected tags, verdicts and individual reasoning.
- [Machine-readable audit](audits/2026-11-19/audit.json): full population IDs, seed, run, retrieval times, short evidence excerpts and SHA-256 hashes.
- [Expected decisions saved before comparison](audits/2026-11-19/reviewer-decisions-before-comparison.json).
- [Verifier](audits/2026-11-19/score_audit.py): reconstructs selection and scores, checks CSV consistency and cost arithmetic using Python's standard library.
- [Cost assumptions and counts](audits/2026-11-19/cost-estimate.json).
- [Token estimator](audits/2026-11-19/estimate_cost.py): requires `tiktoken` and the original captured snapshot. Full source descriptions are retained locally, not republished in this audit; hashes alone cannot regenerate them. Exact token replay requires that original file, not a later live feed.

```sh
python docs/audits/2026-11-19/score_audit.py
```

GitHub Actions runs this verification on pushes and pull requests. It validates the recorded arithmetic and sample selection, **not the correctness of the reviewer's judgments**. Independent human review is still needed to turn this self-review into a human-validated benchmark.
