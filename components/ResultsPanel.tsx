import {
  REASONS,
  REASON_LABELS,
  type MatchRequest,
  type MatchResponse,
} from "../lib/types";
import { ContractorCard } from "./ContractorCard";
import { Icon } from "./Icons";
export function ResultsPanel({
  result,
  query,
  loading,
  stale,
}: {
  result: MatchResponse;
  query: MatchRequest;
  loading: boolean;
  stale: boolean;
}) {
  const d = result.diagnostics;
  return (
    <section
      className={`results ${loading ? "is-loading" : ""}`}
      aria-label="Результаты подбора"
      aria-busy={loading}
    >
      <div className="results-heading">
        <div>
          <p className="eyebrow">ВАША ПОДБОРКА</p>
          <h2>
            {result.status === "matched"
              ? "Есть совпадение"
              : result.status === "no_category_in_city"
                ? "Категории пока нет"
                : "Нет подходящих вариантов"}
            <span className="result-count">{result.results.length}</span>
          </h2>
        </div>
        <span className="catalog-label">ИЗ КАТАЛОГА · 66</span>
      </div>
      <div className="query-summary">
        <span>{query.city}</span>
        <span>{query.category}</span>
        <span>{query.eventDate.split("-").reverse().join(".")}</span>
      </div>
      <p className="result-message" role="status">
        {loading ? "Проверяем условия и календарь…" : result.message}
      </p>
      {stale && (
        <p className="stale-note">
          Условия изменены. Нажмите «Подобрать подрядчиков», чтобы обновить
          результат.
        </p>
      )}
      <div className="calendar-note">
        <Icon name="calendar" size={18} />
        <span>{d.calendarNote}</span>
      </div>
      {result.results.length ? (
        <div className="card-list">
          {result.results.map((c, i) => (
            <ContractorCard key={c.id} card={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="search" size={30} />
          </div>
          <h3>
            {result.status === "no_category_in_city"
              ? "В этом городе такой категории нет"
              : "Все профили исключены по условиям"}
          </h3>
          <p>
            {result.status === "no_category_in_city"
              ? "Попробуйте другой город или категорию. Каталог ограничен исходными 66 профилями."
              : "Посмотрите причины ниже и измените дату, бюджет или другие условия. Мы не подменяем неподходящие профили."}
          </p>
        </div>
      )}
      <details className="diagnostics" open={result.results.length < 3}>
        <summary>
          <span>
            {result.results.length < 3
              ? "Почему меньше трёх?"
              : "Почему именно эти?"}
          </span>
          <span aria-hidden="true">+</span>
        </summary>
        <div className="diagnostic-content">
          <p>
            Проверено в городе и категории:{" "}
            <strong>{d.cityCategoryCount}</strong>. После всех ограничений:{" "}
            <strong>{d.eligibleBeforeTop3}</strong>. Показано:{" "}
            <strong>{d.displayedCount}</strong>.
          </p>
          <div className="reason-grid">
            {REASONS.map((r) => (
              <div key={r}>
                <span>{REASON_LABELS[r]}</span>
                <strong>{d.excludedByReason[r]}</strong>
              </div>
            ))}
          </div>
          <p className="small-note">
            Причины могут пересекаться: один профиль может не пройти несколько
            условий. Порядок — по запасу бюджета, затем по стартовой цене и ID.
            AI не меняет отбор.
          </p>
        </div>
      </details>
      <p className="ai-note">
        <Icon name="spark" size={14} />
        {result.ai.reason}
      </p>
      <p className="results-disclaimer">
        Указаны стартовые цены. Доступность — по календарю анонимизированного
        набора, не в реальном времени. Профили не являются проверенными
        предложениями реальных подрядчиков.
      </p>
    </section>
  );
}
