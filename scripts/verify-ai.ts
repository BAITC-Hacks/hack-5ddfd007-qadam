import { aiConfig, explain } from '../lib/explain';
import { loadContractors } from '../lib/dataset';
import { DEMOS } from '../lib/demo-cases';
import { matchAndRank } from '../lib/matching';
const config = aiConfig(false);
if (!config) {
  console.log('Live AI NOT VERIFIED: configure AI_PROVIDER, API key and model in .env.local. Offline matching remains available.');
  process.exitCode = 1;
} else {
  const response = await explain(matchAndRank(loadContractors(), DEMOS.sparse), DEMOS.sparse, config);
  console.log(JSON.stringify({ provider: config.provider, model: config.model, mode: response.ai.mode, ids: response.results.map(r => r.id) }));
  if (response.ai.mode === 'llm') console.log('Live grounded explanation passed. You may now set AI_VERIFIED=true for this provider/model.');
  else { console.log('Live AI NOT VERIFIED: provider failed or output rejected. Keep AI_VERIFIED=false.'); process.exitCode = 1; }
}
