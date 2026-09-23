export const MIN_DATE = '2026-09-23';
export const MAX_DATE = '2026-12-31';
export type Contractor = {
  id: string; anonName: string; categories: string[]; city: string;
  cityImputed: boolean; synthetic: boolean; priceFromKzt: number; priceImputed: boolean;
  eventFormats: string[]; languages: string[]; maxHours: number | null;
  busyDates: string[]; description: string;
};
export type MatchRequest = {
  city: string; eventDate: string; eventFormat: string; category: string;
  budgetKzt: number; language?: string | null; durationHours?: number | null;
};
export type Options = { cities: string[]; categories: string[]; eventFormats: string[]; languages: string[] };
export const REASONS = ['busy_date', 'over_budget', 'format_mismatch', 'language_mismatch', 'duration_exceeded'] as const;
export type Reason = typeof REASONS[number];
export const REASON_LABELS: Record<Reason, string> = {
  busy_date: 'Заняты в эту дату', over_budget: 'Выше бюджета', format_mismatch: 'Другой формат',
  language_mismatch: 'Не указан нужный язык', duration_exceeded: 'Недостаточная длительность',
};
export type Evidence = {
  availableOnDate: true; eventDate: string; withinBudget: true; supportedFormat: string;
  supportedLanguage: string | null; supportedDurationHours: number | null;
  maxHours: number | null; descriptionExcerpt: string;
};
export type ResultCard = {
  id: string; anonName: string; matchedCategory: string; city: string; priceFromKzt: number;
  synthetic: boolean; priceImputed: boolean; cityImputed: boolean;
  explanation: string; explanationSource: 'llm' | 'deterministic_fallback'; evidence: Evidence;
};
export type MatchResponse = {
  status: 'matched' | 'no_category_in_city' | 'no_eligible_candidates';
  message: string; results: ResultCard[];
  diagnostics: {
    cityCategoryCount: number; eligibleBeforeTop3: number; displayedCount: number; busyOnDateCount: number;
    excludedByReason: Record<Reason, number>; primaryExclusion: Record<Reason, number>;
    exclusionCountsCanOverlap: true; calendarNote: string;
  };
  ai: { mode: 'llm' | 'deterministic_fallback'; reason: string };
};
