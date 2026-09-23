import { afterEach, expect, it, vi } from 'vitest';
import { handleRecommend } from '../lib/api';
import { DEMOS } from '../lib/demo-cases';
const request = (body: unknown) => new Request('http://localhost/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
afterEach(() => vi.unstubAllEnvs());
it.each(Object.entries(DEMOS))('API accepts fixture %s', async (_name, q) => {
  vi.stubEnv('AI_PROVIDER', 'none');
  const response = await handleRecommend(request(q));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.results.length).toBeLessThanOrEqual(3);
  expect(body.results.every((r: { explanationSource: string }) => r.explanationSource === 'deterministic_fallback')).toBe(true);
});
it.each([{ eventDate: '2027-01-01' }, { eventDate: '2026-11-31' }, { budgetKzt: -1 }, { budgetKzt: '100' }, { durationHours: 0 }, { language: 'invented' }, { city: 'Москва' }, { extra: true }])('invalid input returns 400: %j', async patch => {
  const response = await handleRecommend(request({ ...DEMOS.dense, ...patch }));
  expect(response.status).toBe(400);
  expect((await response.json()).error.code).toBe('invalid_request');
});
it('limits body size even without content-length and rejects malformed JSON', async () => {
  expect((await handleRecommend(request({ text: 'я'.repeat(3000) }))).status).toBe(413);
  expect((await handleRecommend(new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status).toBe(400);
  expect((await handleRecommend(new Request('http://localhost', { method: 'POST', body: '{}' }))).status).toBe(415);
});
it('missing dataset returns explicit 503 without paths or stack traces', async () => {
  vi.stubEnv('DATASET_PATH', 'missing-private-path.csv');
  const response = await handleRecommend(request(DEMOS.dense));
  expect(response.status).toBe(503);
  const text = await response.text();
  expect(text).toContain('dataset_unavailable');
  expect(text).not.toContain('missing-private-path');
  expect(text).not.toContain('stack');
});
