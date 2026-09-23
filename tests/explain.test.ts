import { afterEach, expect, it, vi } from 'vitest';
import { loadContractors } from '../lib/dataset';
import { DEMOS } from '../lib/demo-cases';
import { matchAndRank } from '../lib/matching';
import { aiConfig, explain, validateExplanations, type AIConfig } from '../lib/explain';
const base = matchAndRank(loadContractors(), DEMOS.dense);
const config: AIConfig = { provider: 'openai', key: 'test-only-secret', model: 'test-only-model', url: 'https://api.openai.com/v1/chat/completions' };
const valid = () => ({ explanations: base.results.map(r => ({ id: r.id, explanation: r.explanation })) });
afterEach(() => vi.unstubAllEnvs());
it('disabled and unverified providers cannot make live calls', async () => {
  vi.stubEnv('AI_PROVIDER', 'none');
  expect(aiConfig()).toBeNull();
  const fetcher = vi.fn();
  expect(await explain(base, DEMOS.dense, null, fetcher)).toEqual(base);
  expect(fetcher).not.toHaveBeenCalled();
});
it('valid grounded JSON can change wording only; one batched call', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(valid()) } }] }));
  const result = await explain(base, DEMOS.dense, config, fetcher);
  expect(result.ai.mode).toBe('llm');
  expect(result.results.map(r => r.id)).toEqual(base.results.map(r => r.id));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(result)).not.toContain(config.key);
});
it('rejects missing, reordered, duplicated IDs and unsupported factual claims', () => {
  expect(validateExplanations(valid(), base.results, DEMOS.dense)).not.toBeNull();
  const reverse = valid(); reverse.explanations.reverse();
  expect(validateExplanations(reverse, base.results, DEMOS.dense)).toBeNull();
  const duplicate = valid(); duplicate.explanations[1].id = duplicate.explanations[0].id;
  expect(validateExplanations(duplicate, base.results, DEMOS.dense)).toBeNull();
  const hallucination = valid(); hallucination.explanations[0].explanation += ' Гарантированная бронь за 999999999 ₸.';
  expect(validateExplanations(hallucination, base.results, DEMOS.dense)).toBeNull();
  expect(validateExplanations({ explanations: valid().explanations.slice(1) }, base.results, DEMOS.dense)).toBeNull();
});
it('timeout and invalid responses preserve exact IDs and fallback labels', async () => {
  for (const fetcher of [vi.fn().mockRejectedValue(new DOMException('Timeout', 'TimeoutError')), vi.fn().mockResolvedValue(Response.json({ bad: true })), vi.fn().mockResolvedValue(new Response('secret', { status: 401 }))]) {
    const result = await explain(base, DEMOS.dense, config, fetcher);
    expect(result.results).toEqual(base.results);
    expect(result.ai.mode).toBe('deterministic_fallback');
  }
});
it('never calls the model for zero results', async () => {
  const fetcher = vi.fn();
  await explain(matchAndRank(loadContractors(), DEMOS.empty), DEMOS.empty, config, fetcher);
  expect(fetcher).not.toHaveBeenCalled();
});
it('invalid provider URL falls back instead of breaking matching or leaking a key', () => {
  vi.stubEnv('AI_PROVIDER', 'nvidia'); vi.stubEnv('AI_VERIFIED', 'true');
  vi.stubEnv('NVIDIA_API_KEY', 'test-only-secret'); vi.stubEnv('NVIDIA_MODEL', 'test-only-model');
  for (const url of ['not a URL', 'https://example.com/v1', 'https://api.openai.com/v1', 'https://integrate.api.nvidia.com:1234/v1']) {
    vi.stubEnv('NVIDIA_BASE_URL', url);
    expect(aiConfig()).toBeNull();
  }
});
