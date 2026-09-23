# Local implementation checkpoints

All timestamps below are actual local time (UTC+5). No organizer reporting form has been supplied. Local records are not proof of remote submission.

## Milestone 1 — 2026-09-23 13:56 UTC+5

- Official clone: `D:\PROJECTSSS\hack-5ddfd007-qadam`, branch `main`, starting revision `e225a68`.
- GitHub read-only checks: authenticated account `mrchles`, repository permission WRITE, default branch main. Main branch endpoint returned protected=false. Rulesets endpoint returned 403; this is inconclusive for rulesets.
- No AGENTS.md, contribution instructions, workflow, license, data redistribution policy or submission procedure found in local/remote repository. The remote contained README.md only.
- Original CSV validated in place, unchanged: 66 records, 13 headers, 17 categories; 50 Алматы, 15 Астана, 1 Зарубежье; 13 synthetic, 18 price-imputed, 8 city-imputed, 9 null max_hours.
- SHA-256: `6a724b6b7dfb5973343e68ba18dadb60fc807d87e3d78f03ee86fb26cb089f7d`.
- Implemented: strict CSV/request validation; deterministic constraints/ranking; three statuses; overlapping and primary exclusion counts; bounded API body; optional provider adapter with validation and offline fallback.
- `npm run validate:data`: PASS. `npm test`: PASS, 43 tests across 4 files at 13:49:59. `npm run typecheck`: PASS.
- All six supplied acceptance fixtures passed. Dense: four eligible, three displayed; sparse: HK-39372 only; absent category and busy venue return distinct empty statuses; photographer dates produce expected 3/2 sets.
- Live provider verification: NOT RUN, no API keys configured. Provider behavior tested with mocks only. Participant manual verification: NOT YET.
- UI drafts are intentionally excluded from the Milestone 1 commit. A local production build with those drafts passed; it emitted a filesystem tracing warning that remains to resolve before final verification.
- Dataset and .env.local are ignored. Redistribution remains unclarified; judges need organizer-approved access to the original file.
- Local checkpoint commit created at 13:57:13: `f43ced72b52037c4f76fbd2885e137031c59e9e6`.
- User explicitly approved this checkpoint push. At 13:59:05, `git push origin f43ced72b52037c4f76fbd2885e137031c59e9e6:refs/heads/main` succeeded; `git ls-remote` confirmed the identical SHA on official main. No PR, merge or deployment occurred. No UI files or CSV were included.

## Original-data setup for this checkpoint

Use Node 24.21.0 and npm 11.19.0 (versions actually tested). Dependencies are pinned in package-lock.json.

Place the organizer-provided byte-preserved file named `hackathon dataset anonymized.csv` in the repository root. It is intentionally not committed. Alternatively set DATASET_PATH to its location. Do not fabricate missing data.

```powershell
npm ci
npm run validate:data
npm test
```

The UI and browser verification are the next milestone, not part of this core checkpoint.

## Milestone 2 — 2026-09-23 14:10 UTC+5

- Implemented Russian responsive form/cards, all three statuses, validation/loading/error/retry states, imputation/synthetic chips, explanation-source labels, calendar and overlapping diagnostics, six demo scenarios, and four-step explanation of the pipeline.
- Matching/filtering/ranking code (`lib/matching.ts`, `lib/schema.ts`, `lib/evidence.ts`) is unchanged from approved checkpoint f43ced7. Infrastructure changes: explicitly exclude local CSV from automatic file tracing, pin Turbopack workspace root, load .env.local in validation/tests, reject malformed or mismatched AI endpoint configuration with fallback.
- Added README launch/data/AI/API/licensing documentation, `.nvmrc`, and `docs/DEMO.md`. No site template, external images, webfonts, booking flow or separate service.
- Core/API tests: **44 passed / 4 files** at 14:03:55; includes new malformed-provider-URL regression test. TypeScript: PASS. Production build: PASS, no remaining build warnings after local-file tracing/workspace fixes.
- Real Chromium 153.0.8010.12 (Playwright 1.63.0): **4 browser suites passed in 6.2s** after fixes. Desktop 1440px, mobile 390px. Six scenario checks, exact IDs, calendar change, repeat ordering, fallback labels, date error, network failure/retry, no horizontal overflow, and CSV/.env HTTP 404.
- Dense browser output: `[HK-88430, HK-29829, HK-27222]`; 4 eligible / 10 local-category profiles, 4 busy exclusions. Sparse: `[HK-39372]`, 1 of 2 busy. Photographer sets: 3 on Oct 10, 2 on Oct 11 as specified. No desktop page JavaScript errors were captured.
- Accessibility: axe-core automated WCAG 2/2.1 A/AA scan reports **zero detected violations** at both widths. This is not a claim of complete accessibility certification or manual assistive-technology testing.
- Failures encountered and resolved: first browser test used an incorrect whitespace-sensitive heading selector; mobile test initially matched Next.js route-announcer as well as the intended alert. Test selectors corrected, matching logic unchanged. Accessibility audit found insufficient contrast in secondary labels: darkened labels and enlarged small form/disclosure/explanation text, reran successfully.
- Screenshots generated and visually inspected: `artifacts/desktop-dense.png`, `desktop-sparse.png`, `desktop-empty.png`, `desktop-date-change.png`, `mobile-dense.png`. They are ignored/local, not pushed. HTML browser report: `playwright-report/index.html`.
- Fresh-directory reproduction at `.verification/repro-20260923-1405`: `npm ci` PASS (88 packages, 0 audit findings), original CSV validation PASS, 44 tests PASS, production build PASS. Final copied UI/config build PASS without workspace-root warning. Independent `npm start -- --port 3100`: home HTTP 200 and dense API returned `matched`, exact same 3 ordered IDs, 4 eligible, 4 busy, `deterministic_fallback` at 14:09:34.
- Initial npm install/ci printed an esbuild install-script approval advisory; tsx/Vitest/build executed successfully. Playwright printed a NO_COLOR/FORCE_COLOR environment warning; tests passed.
- SHA-256 of source CSV remains unchanged. Public client chunks contain no API-key environment identifiers or raw CSV marker checked. `.env.example` contains placeholders only. Index is empty; no data or credentials staged.
- Live AI: **NOT VERIFIED / unavailable**, no key. `npm run verify:ai` explicitly exited 1 without a provider call. Mocked provider tests are not represented as live evidence. Participant manual verification remains **NOT YET**.
- Official main remains `f43ced72b52037c4f76fbd2885e137031c59e9e6` (approved first checkpoint). UI/documentation/hardening remain local and uncommitted. No additional push, PR, merge, deployment or submission performed.
- Local review server: http://127.0.0.1:3000. Remaining external blockers: organizer-approved CSV distribution/judge access, submission/reporting procedure, and optional live provider credentials. No known failing automated test at this checkpoint.

## Milestone 3 — OpenAI validation hardening (local checkpoint candidate)

- Live verification #1 used `gpt-4o-mini`: OpenAI returned HTTP 200 with `finish_reason=stop` in 4.84 s, but the former lexical allowlist rejected a grounded natural-language response and fallback remained active. The provider payload was not retained or logged.
- Root cause reproduced offline: exact ordered IDs and supported facts could still fail solely because natural Russian inflections were absent from a hard-coded vocabulary. The allowlist was replaced with explicit checks for response shape, ID order, sentence count, date, calendar and booking caveats, starting price, budget, format, optional language/duration/max-hours, unsupported numbers, unsafe claims, and duplicate explanations.
- OpenAI now receives a strict JSON Schema matching the runtime Zod schema. Safe `ai.code` values identify provider, parsing, schema and validation categories without exposing keys, headers, provider bodies or dataset descriptions. Matching/ranking rules are unchanged.
- Live verification #2, after that fix: exactly one `gpt-4o-mini` call, HTTP 200, 4.80 s provider / 4.83 s total, under 10 s. It reached `validation_sentence_count`; fallback preserved ordered IDs `HK-88430`, `HK-29829`, `HK-27222`, prices and availability. No retry occurred. Genuine AI explanations therefore remain **not yet verified**.
- Offline inspection confirmed `Intl.Segmenter('ru')` keeps `5 ч. при лимите 6 ч.` within the intended sentence and rejects a genuine three-sentence mock. Since the live response text was deliberately not retained, its wording cannot be reconstructed; the safe diagnostic indicates more than two observed sentence segments. The prompt now requests exactly one concise sentence while runtime acceptance remains one or two. No explanation is truncated.
- This checkpoint contains no `.env.local`, key, CSV, generated artifact or live response body. A further paid verification requires explicit approval.
