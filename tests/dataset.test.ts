import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { loadContractors, parseDataset } from '../lib/dataset';
const source = readFileSync(process.env.DATASET_PATH || 'hackathon dataset anonymized.csv', 'utf8');
afterEach(() => vi.unstubAllEnvs());
it('parses original RFC4180 CSV and preserves descriptions containing commas', () => {
  const p = parseDataset(source);
  expect(p).toHaveLength(66);
  expect(p[0].description).toContain('SkyLumen, CoffeeNoir');
  expect(p[0].maxHours).toBeNull();
  expect(p[0].priceImputed).toBe(true);
});
it('reports record and field; never silently skips bad rows', () => {
  expect(() => parseDataset(source.replace('HK-39372', 'bad-id'))).toThrow(/record 2: id/);
  expect(() => parseDataset(source.replace('HK-44733', 'HK-39372'))).toThrow(/duplicate id/);
  expect(() => parseDataset(source.replace('2026-09-25', '2026-02-30'))).toThrow(/busy_dates/);
  expect(() => parseDataset(source.replace('200000', '-1'))).toThrow(/price_from_kzt/);
  expect(() => parseDataset(source.replace('anon_name', 'name'))).toThrow(/headers/);
});
it('missing dataset fails explicitly instead of returning empty recommendations', () => {
  vi.stubEnv('DATASET_PATH', 'does-not-exist.csv');
  expect(() => loadContractors()).toThrow(/missing or unreadable/);
});
it('modified dataset fails hash verification', () => {
  const dir = mkdtempSync(join(tmpdir(), 'qadam-test-'));
  try {
    const file = join(dir, 'data.csv');
    writeFileSync(file, source.replace('SkyLumen', 'OtherName'));
    vi.stubEnv('DATASET_PATH', file);
    expect(() => loadContractors()).toThrow(/SHA-256 mismatch/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
