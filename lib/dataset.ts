// Node-only module: imported by server entry points, scripts and tests, never client components.
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import { csvRowSchema } from './schema';
import type { Contractor, Options } from './types';

export const ORIGINAL_SHA256 = '6a724b6b7dfb5973343e68ba18dadb60fc807d87e3d78f03ee86fb26cb089f7d';
const HEADERS = ['id', 'anon_name', 'categories', 'city', 'city_imputed', 'synthetic', 'price_from_kzt', 'price_imputed', 'event_formats', 'languages', 'max_hours', 'busy_dates', 'description'];
export class DatasetError extends Error {}
export function parseDataset(source: string): Contractor[] {
  let rows: Record<string, string>[];
  try {
    rows = parse(source, { bom: true, skip_empty_lines: true, columns: (headers: string[]) => {
      if (JSON.stringify(headers) !== JSON.stringify(HEADERS)) throw new Error('Expected original 13 CSV headers');
      return headers;
    } });
  } catch (e) { throw new DatasetError(`CSV parse error: ${e instanceof Error ? e.message : 'invalid CSV'}`); }
  const ids = new Set<string>();
  const profiles = rows.map((row, index) => {
    const result = csvRowSchema.safeParse(row);
    if (!result.success) throw new DatasetError(`CSV record ${index + 2}: ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    const r = result.data;
    if (ids.has(r.id)) throw new DatasetError(`CSV record ${index + 2}: duplicate id ${r.id}`);
    ids.add(r.id);
    return {
      id: r.id, anonName: r.anon_name, categories: r.categories, city: r.city,
      cityImputed: r.city_imputed, synthetic: r.synthetic, priceFromKzt: r.price_from_kzt,
      priceImputed: r.price_imputed, eventFormats: r.event_formats, languages: r.languages,
      maxHours: r.max_hours, busyDates: r.busy_dates, description: r.description,
    };
  });
  const assert = (condition: boolean, message: string) => { if (!condition) throw new DatasetError(message); };
  assert(profiles.length === 66, `Expected 66 profiles; got ${profiles.length}`);
  const counts = (field: 'synthetic' | 'priceImputed' | 'cityImputed') => profiles.filter(p => p[field]).length;
  assert(counts('synthetic') === 13 && counts('priceImputed') === 18 && counts('cityImputed') === 8, 'Original flag counts do not match');
  assert(profiles.filter(p => p.maxHours === null).length === 9, 'Expected 9 empty max_hours');
  for (const [city, count] of Object.entries({ Алматы: 50, Астана: 15, Зарубежье: 1 })) {
    assert(profiles.filter(p => p.city === city).length === count, `Unexpected city count: ${city}`);
  }
  assert(new Set(profiles.flatMap(p => p.categories)).size === 17, 'Expected 17 categories');
  const dates = profiles.flatMap(p => p.busyDates).sort();
  assert(dates[0] === '2026-09-23' && dates.at(-1) === '2026-12-31', 'Calendar boundaries do not match');
  return profiles;
}
let cache: { key: string; profiles: Contractor[] } | undefined;
export function loadContractors(): Contractor[] {
  // Local runtime input, deliberately excluded from automatic deployment tracing.
  // Judges must supply the original CSV separately; see README for DATASET_PATH.
  const path = resolve(/* turbopackIgnore: true */ process.cwd(), process.env.DATASET_PATH || 'hackathon dataset anonymized.csv');
  try {
    const stat = statSync(path);
    const key = `${path}:${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}`;
    if (cache?.key === key) return cache.profiles;
    const bytes = readFileSync(path);
    const profiles = parseDataset(bytes.toString('utf8'));
    if (createHash('sha256').update(bytes).digest('hex') !== ORIGINAL_SHA256) {
      throw new DatasetError('CSV differs from the original file (SHA-256 mismatch). Restore the byte-preserved organizer CSV.');
    }
    cache = { key, profiles };
    return profiles;
  } catch (e) {
    if (e instanceof DatasetError) throw e;
    throw new DatasetError('Original CSV is missing or unreadable. Set DATASET_PATH to the organizer file.');
  }
}
export function getOptions(profiles: Contractor[]): Options {
  const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return { cities: unique(profiles.map(p => p.city)), categories: unique(profiles.flatMap(p => p.categories)),
    eventFormats: unique(profiles.flatMap(p => p.eventFormats)), languages: unique(profiles.flatMap(p => p.languages)) };
}
