import { afterEach, expect, it, vi } from 'vitest';
import { loadContractors } from '../lib/dataset';
import { DEMOS } from '../lib/demo-cases';
import { matchAndRank } from '../lib/matching';
import { aiConfig, explain, validateExplanations, validateExplanationsDetailed, type AIConfig } from '../lib/explain';
const base = matchAndRank(loadContractors(), DEMOS.dense);
const config: AIConfig = { provider: 'openai', key: 'test-only-secret', model: 'test-only-model', url: 'https://api.openai.com/v1/chat/completions' };
const disclaimer = `В календаре набора данных нет отметки о занятости на ${DEMOS.dense.eventDate}; это не подтверждение бронирования.`;
const naturalGrounded = () => ({ explanations: base.results.map(r => ({
  id: r.id,
  explanation: `Для корпоратива стартовая цена профиля — ${new Intl.NumberFormat('ru-RU').format(r.priceFromKzt)} ₸, она укладывается в бюджет 1 200 000 ₸; русский язык и запрос на 5 часов поддерживаются лимитом ${r.evidence.maxHours} часов.`,
})) });
const valid = naturalGrounded;
const oneSentenceGrounded = () => ({ explanations: base.results.map(r => ({
  id: r.id,
  explanation: `Для формата корпоратив профиль со стартовой ценой ${new Intl.NumberFormat('ru-RU').format(r.priceFromKzt)} ₸ укладывается в бюджет 1 200 000 ₸, поддерживает русский язык и 5 часов при лимите ${r.evidence.maxHours} часов.`,
})) });
const abbreviationGrounded = () => ({ explanations: base.results.map(r => ({
  id: r.id,
  explanation: `Для формата корпоратив стартовая цена ${new Intl.NumberFormat('ru-RU').format(r.priceFromKzt)} ₸ укладывается в бюджет 1 200 000 ₸. Русский язык и длительность 5 ч. поддерживаются при лимите ${r.evidence.maxHours} ч.`,
})) });
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
  expect(result.ai.code).toBe('llm_ok');
  expect(result.results.map(r => r.id)).toEqual(base.results.map(r => r.id));
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(result.results.every((r, index) => r.explanation === `${valid().explanations[index].explanation} ${disclaimer}`)).toBe(true);
  expect(JSON.stringify(result)).not.toContain(config.key);
  const request = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
  expect(request.response_format.type).toBe('json_schema');
  expect(request.response_format.json_schema.strict).toBe(true);
});
it('accepts grounded natural Russian that the old lexical allowlist rejected', async () => {
  const mockedModelResponse = naturalGrounded();
  expect(validateExplanationsDetailed(mockedModelResponse, base.results, DEMOS.dense)).toEqual({
    ok: true,
    explanations: mockedModelResponse.explanations.map(item => item.explanation),
  });
  const fetcher = vi.fn().mockResolvedValue(Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(mockedModelResponse) } }] }));
  const result = await explain(base, DEMOS.dense, config, fetcher);
  expect(result.ai).toMatchObject({ mode: 'llm', code: 'llm_ok' });
  expect(result.results.map(r => r.explanationSource)).toEqual(['llm', 'llm', 'llm']);
  expect(result.results.map(r => r.id)).toEqual(base.results.map(r => r.id));
  expect(result.results.map(r => r.priceFromKzt)).toEqual(base.results.map(r => r.priceFromKzt));
  expect(result.results.map(r => r.evidence.availableOnDate)).toEqual([true, true, true]);
  expect(result.results.every(r => r.explanation.endsWith(disclaimer))).toBe(true);
});
it('accepts grounded model text without calendar or booking disclaimers', () => {
  expect(validateExplanationsDetailed(oneSentenceGrounded(), base.results, DEMOS.dense).ok).toBe(true);
  expect(validateExplanationsDetailed(abbreviationGrounded(), base.results, DEMOS.dense).ok).toBe(true);
});
it('rejects a genuinely excessive three-sentence explanation without truncating it', () => {
  const invalid = oneSentenceGrounded();
  invalid.explanations[0].explanation = 'Для формата корпоратив стартовая цена 500 000 ₸ укладывается в бюджет 1 200 000 ₸. Профиль поддерживает русский язык. Запрос на 5 часов укладывается в лимит 6 часов.';
  expect(validateExplanationsDetailed(invalid, base.results, DEMOS.dense)).toEqual({
    ok: false,
    code: 'validation_sentence_count',
    itemIndex: 0,
  });
  expect(invalid.explanations[0].explanation).toContain('Запрос на 5 часов');
});
it('rejects model-authored availability wording because the server owns that disclaimer', () => {
  const invalid = oneSentenceGrounded();
  invalid.explanations[0].explanation += ' Профиль доступен для бронирования.';
  expect(validateExplanationsDetailed(invalid, base.results, DEMOS.dense)).toEqual({
    ok: false,
    code: 'validation_model_availability_claim',
    itemIndex: 0,
  });
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
it('returns safe diagnostic codes while preserving exact fallback results', async () => {
  const cases = [
    [vi.fn().mockRejectedValue(new DOMException('Timeout', 'TimeoutError')), 'provider_timeout'],
    [vi.fn().mockRejectedValue(new TypeError('network failed')), 'provider_network_error'],
    [vi.fn().mockResolvedValue(Response.json({ bad: true })), 'provider_response_schema'],
    [vi.fn().mockResolvedValue(new Response('secret', { status: 401 })), 'provider_http_error'],
    [vi.fn().mockResolvedValue(new Response('{', { status: 200 })), 'provider_invalid_json'],
    [vi.fn().mockResolvedValue(Response.json({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] })), 'provider_incomplete'],
    [vi.fn().mockResolvedValue(Response.json({ choices: [{ finish_reason: 'stop', message: { content: '{' } }] })), 'model_content_invalid_json'],
  ] as const;
  for (const [fetcher, expectedCode] of cases) {
    const result = await explain(base, DEMOS.dense, config, fetcher);
    expect(result.results).toEqual(base.results);
    expect(result.ai.mode).toBe('deterministic_fallback');
    expect(result.ai.code).toBe(expectedCode);
    expect(JSON.stringify(result)).not.toContain(config.key);
  }
});
it('identifies exact factual-validation failures without exposing content', () => {
  const missingPrice = naturalGrounded();
  missingPrice.explanations[0].explanation = missingPrice.explanations[0].explanation.replace('500 000', '700 000');
  expect(validateExplanationsDetailed(missingPrice, base.results, DEMOS.dense)).toEqual({ ok: false, code: 'validation_missing_price', itemIndex: 0 });
  const unsafe = naturalGrounded();
  unsafe.explanations[0].explanation = unsafe.explanations[0].explanation.replace('она укладывается', 'лучший профиль, цена укладывается');
  expect(validateExplanationsDetailed(unsafe, base.results, DEMOS.dense)).toEqual({ ok: false, code: 'validation_unsafe_claim', itemIndex: 0 });
  const reordered = naturalGrounded();
  reordered.explanations.reverse();
  expect(validateExplanationsDetailed(reordered, base.results, DEMOS.dense)).toEqual({ ok: false, code: 'validation_id_order_mismatch', itemIndex: 0 });
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
