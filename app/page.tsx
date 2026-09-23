import { getOptions, loadContractors } from "../lib/data";
import { matchAndRank } from "../lib/matching";
import { DEMOS } from "../lib/demo-cases";
import { MatchingApp } from "../components/MatchingApp";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default function Page() {
  try {
    const profiles = loadContractors();
    return (
      <MatchingApp
        options={getOptions(profiles)}
        initialResult={matchAndRank(profiles, DEMOS.dense)}
      />
    );
  } catch {
    return (
      <main className="setup-error">
        <span className="wordmark">
          QADAM<span>↗</span>
        </span>
        <p className="eyebrow">КАТАЛОГ НЕДОСТУПЕН</p>
        <h1>Нужен исходный файл данных</h1>
        <p>
          Каталог отсутствует или не прошёл проверку. Подбор не выполняется без
          оригинальных данных.
        </p>
        <p>
          Укажите путь к CSV организаторов в <code>DATASET_PATH</code> и
          выполните <code>npm run validate:data</code>. Подробности — в README.
        </p>
        <a className="primary-button" href="/">
          Проверить снова ↗
        </a>
      </main>
    );
  }
}
