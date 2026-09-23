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
- Push/PR/merge/deployment: not performed. Await explicit push approval after showing the local checkpoint commit.

## Original-data setup for this checkpoint

Use Node 24.21.0 and npm 11.19.0 (versions actually tested). Dependencies are pinned in package-lock.json.

Place the organizer-provided byte-preserved file named `hackathon dataset anonymized.csv` in the repository root. It is intentionally not committed. Alternatively set DATASET_PATH to its location. Do not fabricate missing data.

```powershell
npm ci
npm run validate:data
npm test
```

The UI and browser verification are the next milestone, not part of this core checkpoint.
