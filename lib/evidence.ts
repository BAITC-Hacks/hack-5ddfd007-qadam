import type { Contractor, Evidence, MatchRequest } from './types';
export const money = (amount: number) => new Intl.NumberFormat('ru-RU').format(amount);
export function buildEvidence(p: Contractor, q: MatchRequest): Evidence {
  const excerpt = p.description.slice(0, 180);
  return { availableOnDate: true, eventDate: q.eventDate, withinBudget: true, supportedFormat: q.eventFormat,
    supportedLanguage: q.language ?? null, supportedDurationHours: q.durationHours ?? null,
    maxHours: p.maxHours, descriptionExcerpt: excerpt + (p.description.length > 180 ? '…' : '') };
}
export function renderFallbackExplanation(p: Contractor, q: MatchRequest): string {
  const language = q.language ? `; язык — ${q.language}` : `; языки — ${p.languages.join(', ')}`;
  const duration = q.durationHours ? (p.maxHours === null ? `; лимит часов в профиле не применяется` : `; ${q.durationHours} ч укладываются в лимит ${p.maxHours} ч`) : (p.maxHours === null ? '' : `; лимит — ${p.maxHours} ч`);
  return `Для формата «${q.eventFormat}» стартовая цена ${money(p.priceFromKzt)} ₸ укладывается в бюджет ${money(q.budgetKzt)} ₸${language}${duration}. В календаре набора данных нет отметки о занятости на ${q.eventDate}; это не подтверждение бронирования.`;
}
