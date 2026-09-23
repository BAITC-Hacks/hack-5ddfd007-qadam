import { aiConfig, explain } from '../lib/explain';
import { loadContractors } from '../lib/dataset';
import { DEMOS } from '../lib/demo-cases';
import { matchAndRank } from '../lib/matching';
const config = aiConfig(false);
if (!config) {
  console.log('Live AI NOT VERIFIED: configure AI_PROVIDER, API key and model in .env.local. Offline matching remains available.');
  process.exitCode = 1;
} else {
  const baseline = matchAndRank(loadContractors(), DEMOS.dense);
  const started = performance.now();
  const response = await explain(baseline, DEMOS.dense, config);
  console.log(JSON.stringify({
    provider: config.provider,
    model: config.model,
    mode: response.ai.mode,
    diagnosticCode: response.ai.code,
    elapsedMs: Math.round(performance.now() - started),
    ids: response.results.map(result => result.id),
    idsUnchanged: JSON.stringify(response.results.map(result => result.id)) === JSON.stringify(baseline.results.map(result => result.id)),
    pricesUnchanged: JSON.stringify(response.results.map(result => result.priceFromKzt)) === JSON.stringify(baseline.results.map(result => result.priceFromKzt)),
    availabilityUnchanged: response.results.every((result, index) => result.evidence.availableOnDate === baseline.results[index].evidence.availableOnDate),
    explanations: response.results.map(result => ({
      id: result.id,
      priceFromKzt: result.priceFromKzt,
      maxHours: result.evidence.maxHours,
      source: result.explanationSource,
      explanation: result.explanation,
    })),
  }, null, 2));
  if (response.ai.mode === 'llm') console.log('Live grounded explanation passed. You may now set AI_VERIFIED=true for this provider/model.');
  else { console.log(`Live AI NOT VERIFIED: ${response.ai.code}. Keep AI_VERIFIED=false.`); process.exitCode = 1; }
}
