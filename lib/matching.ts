import { normalize } from './schema';
import { buildEvidence, renderFallbackExplanation } from './evidence';
import { REASONS, REASON_LABELS, type Contractor, type MatchRequest, type MatchResponse, type Reason } from './types';
const same = (a: string, b: string) => normalize(a) === normalize(b);
const contains = (values: string[], value: string) => values.some(v => same(v, value));
export function getCityCategoryCandidates(profiles: Contractor[], q: MatchRequest) {
  return profiles.filter(p => same(p.city, q.city) && contains(p.categories, q.category));
}
export function checkCalendarAndConstraints(p: Contractor, q: MatchRequest): Reason[] {
  const reasons: Reason[] = [];
  if (p.busyDates.includes(q.eventDate)) reasons.push('busy_date');
  if (p.priceFromKzt > q.budgetKzt) reasons.push('over_budget');
  if (!contains(p.eventFormats, q.eventFormat)) reasons.push('format_mismatch');
  if (q.language && !contains(p.languages, q.language)) reasons.push('language_mismatch');
  if (q.durationHours != null && p.maxHours != null && q.durationHours > p.maxHours) reasons.push('duration_exceeded');
  return reasons;
}
// Price-only budget headroom: no inferred qualities or untrusted text affect ranking.
export const score = (p: Contractor, q: MatchRequest) => 30 * (q.budgetKzt - p.priceFromKzt) / q.budgetKzt;
export function rankEligible(profiles: Contractor[], q: MatchRequest) {
  return [...profiles].sort((a, b) => score(b, q) - score(a, q) || a.priceFromKzt - b.priceFromKzt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
export function matchAndRank(profiles: Contractor[], q: MatchRequest): MatchResponse {
  const candidates = getCityCategoryCandidates(profiles, q);
  const emptyCounts = () => Object.fromEntries(REASONS.map(r => [r, 0])) as Record<Reason, number>;
  const excludedByReason = emptyCounts(), primaryExclusion = emptyCounts();
  const eligible = candidates.filter(p => {
    const reasons = checkCalendarAndConstraints(p, q);
    reasons.forEach(r => excludedByReason[r]++);
    if (reasons[0]) primaryExclusion[reasons[0]]++;
    return reasons.length === 0;
  });
  const selected = rankEligible(eligible, q).slice(0, 3);
  const status = !candidates.length ? 'no_category_in_city' : !eligible.length ? 'no_eligible_candidates' : 'matched';
  const reasonText = REASONS.filter(r => excludedByReason[r] > 0).map(r => `${REASON_LABELS[r]}: ${excludedByReason[r]}`).join('; ');
  const message = status === 'no_category_in_city' ? `В городе «${q.city}» нет категории «${q.category}» в этом каталоге.`
    : status === 'no_eligible_candidates' ? `Проверено профилей: ${candidates.length}; подходящих нет. ${reasonText}.`
    : `Подходят ${eligible.length} из ${candidates.length} профилей; показано ${selected.length}.${eligible.length < 3 ? ` ${reasonText || 'Все профили этой категории подходят, но их меньше трёх'}.` : ''}`;
  return {
    status, message,
    results: selected.map(p => ({ id: p.id, anonName: p.anonName, matchedCategory: q.category, city: p.city,
      priceFromKzt: p.priceFromKzt, synthetic: p.synthetic, priceImputed: p.priceImputed, cityImputed: p.cityImputed,
      explanation: renderFallbackExplanation(p, q), explanationSource: 'deterministic_fallback', evidence: buildEvidence(p, q) })),
    diagnostics: { cityCategoryCount: candidates.length, eligibleBeforeTop3: eligible.length, displayedCount: selected.length,
      busyOnDateCount: excludedByReason.busy_date, excludedByReason, primaryExclusion, exclusionCountsCanOverlap: true,
      calendarNote: `На ${q.eventDate} исключено по календарю: ${excludedByReason.busy_date} из ${candidates.length} профилей города и категории.` },
    ai: { mode: 'deterministic_fallback', reason: 'AI отключён или не настроен; объяснения сформированы по данным каталога.', code: 'disabled' },
  };
}
