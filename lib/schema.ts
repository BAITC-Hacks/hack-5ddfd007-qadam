import { z } from 'zod';
import { MAX_DATE, MIN_DATE, type Options } from './types';

export const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
export const windowDate = z.string().refine(isCalendarDate, 'Укажите корректную дату')
  .refine(v => v >= MIN_DATE && v <= MAX_DATE, `Дата должна быть между ${MIN_DATE} и ${MAX_DATE}`);
const flag = z.string().regex(/^(true|false)$/i).transform(v => v.toLowerCase() === 'true');
const positiveInteger = z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().positive().safe());
const list = z.string().transform(v => v.split('|').map(x => x.trim())).pipe(z.array(z.string().min(1)).min(1));
export const csvRowSchema = z.object({
  id: z.string().regex(/^HK-\d+$/), anon_name: z.string().trim().min(1), categories: list,
  city: z.string().trim().min(1), city_imputed: flag, synthetic: flag,
  price_from_kzt: positiveInteger, price_imputed: flag, event_formats: list, languages: list,
  max_hours: z.union([z.literal('').transform(() => null), positiveInteger]),
  busy_dates: z.string().transform(v => v === '' ? [] : v.split('|').map(x => x.trim())).pipe(z.array(windowDate)),
  description: z.string().trim().min(1),
}).strict();
export function requestSchema(options: Options) {
  const choice = (values: string[]) => z.string().trim().min(1).max(100).transform(value =>
    values.find(v => normalize(v) === normalize(value)) ?? value
  ).refine(value => values.includes(value), 'Выберите значение из каталога');
  return z.object({
    city: choice(options.cities), eventDate: windowDate, eventFormat: choice(options.eventFormats),
    category: choice(options.categories), budgetKzt: z.number().int().min(1).max(1_000_000_000),
    language: choice(options.languages).nullish(), durationHours: z.number().int().min(1).max(168).nullish(),
  }).strict();
}
