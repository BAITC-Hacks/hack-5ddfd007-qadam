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
export type AIDiagnosticCode =
  | 'disabled'
  | 'llm_ok'
  | 'provider_http_error'
  | 'provider_timeout'
  | 'provider_network_error'
  | 'provider_response_too_large'
  | 'provider_invalid_json'
  | 'provider_response_schema'
  | 'provider_incomplete'
  | 'model_content_invalid_json'
  | 'validation_response_schema'
  | 'validation_count_mismatch'
  | 'validation_id_order_mismatch'
  | 'validation_sentence_count'
  | 'validation_missing_date'
  | 'validation_missing_calendar_disclaimer'
  | 'validation_missing_booking_disclaimer'
  | 'validation_model_availability_claim'
  | 'validation_missing_price'
  | 'validation_missing_budget'
  | 'validation_missing_format'
  | 'validation_missing_language'
  | 'validation_missing_duration'
  | 'validation_missing_max_hours'
  | 'validation_unsupported_number'
  | 'validation_unsafe_claim'
  | 'validation_duplicate_explanation';
export type MatchResponse = {
  status: 'matched' | 'no_category_in_city' | 'no_eligible_candidates';
  message: string; results: ResultCard[];
  diagnostics: {
    cityCategoryCount: number; eligibleBeforeTop3: number; displayedCount: number; busyOnDateCount: number;
    excludedByReason: Record<Reason, number>; primaryExclusion: Record<Reason, number>;
    exclusionCountsCanOverlap: true; calendarNote: string;
  };
  ai: { mode: 'llm' | 'deterministic_fallback'; reason: string; code: AIDiagnosticCode };
};
