import type { MatchRequest } from './types';
export const DEMOS = {
  dense: { city: 'Алматы', eventDate: '2026-10-10', eventFormat: 'корпоратив', category: 'Ведущий', budgetKzt: 1200000, language: 'русский', durationHours: 5 },
  sparse: { city: 'Алматы', eventDate: '2026-10-05', eventFormat: 'свадьба', category: 'Флорист', budgetKzt: 500000, language: 'русский' },
  empty: { city: 'Астана', eventDate: '2026-10-05', eventFormat: 'свадьба', category: 'Декоратор', budgetKzt: 1000000 },
  busyVenue: { city: 'Астана', eventDate: '2026-11-14', eventFormat: 'свадьба', category: 'Банкетный зал', budgetKzt: 3000000 },
  dateA: { city: 'Алматы', eventDate: '2026-10-10', eventFormat: 'свадьба', category: 'Фотограф', budgetKzt: 1500000 },
  dateB: { city: 'Алматы', eventDate: '2026-10-11', eventFormat: 'свадьба', category: 'Фотограф', budgetKzt: 1500000 },
} satisfies Record<string, MatchRequest>;
