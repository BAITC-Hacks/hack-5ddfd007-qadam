import { describe, expect, it } from 'vitest';
import { getOptions, loadContractors } from '../lib/dataset';
import { DEMOS } from '../lib/demo-cases';
import { checkCalendarAndConstraints, getCityCategoryCandidates, matchAndRank, rankEligible } from '../lib/matching';
import { requestSchema } from '../lib/schema';
import type { MatchRequest } from '../lib/types';
const profiles = loadContractors();
const eligibleIds = (q: MatchRequest) => getCityCategoryCandidates(profiles, q).filter(p => !checkCalendarAndConstraints(p, q).length).map(p => p.id).sort();
describe('six original-dataset acceptance fixtures', () => {
  it('dense: four eligible hosts, exactly three stable results', () => {
    expect(eligibleIds(DEMOS.dense)).toEqual(['HK-88430', 'HK-77838', 'HK-27222', 'HK-29829'].sort());
    const result = matchAndRank(profiles, DEMOS.dense);
    expect(result.status).toBe('matched');
    expect(result.diagnostics.cityCategoryCount).toBe(10);
    expect(result.diagnostics.eligibleBeforeTop3).toBe(4);
    expect(result.results).toHaveLength(3);
    expect(new Set(result.results.map(r => r.explanation)).size).toBe(3);
    console.log('Dense ordered IDs:', result.results.map(r => r.id));
  });
  it('sparse florist: one match; second excluded by calendar', () => {
    const result = matchAndRank(profiles, DEMOS.sparse);
    expect(result.status).toBe('matched');
    expect(result.results.map(r => r.id)).toEqual(['HK-39372']);
    expect(result.diagnostics.cityCategoryCount).toBe(2);
    expect(result.diagnostics.excludedByReason.busy_date).toBe(1);
    expect(result.message).toContain('Заняты в эту дату: 1');
  });
  it('absent category is its own status', () => {
    const r = matchAndRank(profiles, DEMOS.empty);
    expect(r.status).toBe('no_category_in_city');
    expect(r.results).toEqual([]);
    expect(r.diagnostics.cityCategoryCount).toBe(0);
  });
  it('busy venue obeys the same calendar rule', () => {
    const r = matchAndRank(profiles, DEMOS.busyVenue);
    expect(r.status).toBe('no_eligible_candidates');
    expect(r.results).toEqual([]);
    expect(r.diagnostics.cityCategoryCount).toBe(1);
    expect(r.diagnostics.excludedByReason.busy_date).toBe(1);
    expect(getCityCategoryCandidates(profiles, DEMOS.busyVenue)[0].id).toBe('HK-90012');
  });
  it('photographers October 10: exactly three', () => {
    expect(eligibleIds(DEMOS.dateA)).toEqual(['HK-30583', 'HK-53108', 'HK-16628'].sort());
    expect(matchAndRank(profiles, DEMOS.dateA).results).toHaveLength(3);
  });
  it('photographers October 11: exactly two due to actual calendars', () => {
    expect(eligibleIds(DEMOS.dateB)).toEqual(['HK-76268', 'HK-68220'].sort());
    const result = matchAndRank(profiles, DEMOS.dateB);
    expect(result.results).toHaveLength(2);
    expect(result.message).toContain('Заняты в эту дату');
    for (const id of eligibleIds(DEMOS.dateA)) expect(profiles.find(p => p.id === id)?.busyDates).toContain(DEMOS.dateB.eventDate);
    for (const id of eligibleIds(DEMOS.dateB)) expect(profiles.find(p => p.id === id)?.busyDates).toContain(DEMOS.dateA.eventDate);
  });
});
describe('constraints and stability', () => {
  it('five repeated normalized requests preserve ID order even when input rows reverse', () => {
    const expected = matchAndRank(profiles, DEMOS.dense).results.map(r => r.id);
    const q = requestSchema(getOptions(profiles)).parse({ ...DEMOS.dense, city: '  АЛМАТЫ ', category: ' ведущий ' });
    for (let i = 0; i < 5; i++) expect(matchAndRank([...profiles].reverse(), q).results.map(r => r.id)).toEqual(expected);
  });
  it('language and duration are hard filters', () => {
    const p = profiles.find(p => p.id === 'HK-39372')!;
    expect(checkCalendarAndConstraints(p, { ...DEMOS.sparse, language: 'английский' })).toContain('language_mismatch');
    const host = profiles.find(p => p.id === 'HK-88430')!;
    expect(checkCalendarAndConstraints(host, { ...DEMOS.dense, durationHours: host.maxHours! + 1 })).toContain('duration_exceeded');
    expect(checkCalendarAndConstraints(p, { ...DEMOS.sparse, durationHours: 100 })).not.toContain('duration_exceeded');
  });
  it('budget below all prices means no eligible, not absent category', () => {
    expect(matchAndRank(profiles, { ...DEMOS.dense, budgetKzt: 1 }).status).toBe('no_eligible_candidates');
  });
  it.each(['2026-09-22', '2027-01-01', '2026-11-31', 'invalid', '2026-10-10T00:00:00Z'])('rejects invalid date %s', eventDate => {
    expect(requestSchema(getOptions(profiles)).safeParse({ ...DEMOS.dense, eventDate }).success).toBe(false);
  });
  it.each(['2026-09-23', '2026-12-31'])('accepts calendar boundary %s', eventDate => {
    expect(requestSchema(getOptions(profiles)).safeParse({ ...DEMOS.dense, eventDate }).success).toBe(true);
  });
  it('primary reasons partition excluded candidates while all reasons can overlap', () => {
    const r = matchAndRank(profiles, { ...DEMOS.dense, budgetKzt: 1, durationHours: 100 });
    expect(Object.values(r.diagnostics.primaryExclusion).reduce((a,b) => a+b, 0)).toBe(r.diagnostics.cityCategoryCount);
    expect(Object.values(r.diagnostics.excludedByReason).reduce((a,b) => a+b, 0)).toBeGreaterThan(r.diagnostics.cityCategoryCount);
  });
  it('ties use ASCII ID order, with no mutation', () => {
    const p = profiles[0];
    const rows = [{ ...p, id: 'HK-2' }, { ...p, id: 'HK-1' }];
    expect(rankEligible(rows, DEMOS.dense).map(p => p.id)).toEqual(['HK-1', 'HK-2']);
    expect(rows[0].id).toBe('HK-2');
  });
});
