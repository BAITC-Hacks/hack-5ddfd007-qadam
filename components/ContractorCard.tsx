import type { ResultCard } from "../lib/types";
import { money } from "../lib/evidence";
import { Icon } from "./Icons";
export function ContractorCard({
  card,
  index,
}: {
  card: ResultCard;
  index: number;
}) {
  return (
    <article
      className="contractor-card"
      data-testid="contractor-card"
      data-contractor-id={card.id}
    >
      <div className="card-top">
        <div className={`avatar avatar-${index}`} aria-hidden="true">
          {card.anonName
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </div>
        <div className="identity">
          <div className="card-category">
            {card.matchedCategory}
            <span className="rank">0{index + 1}</span>
          </div>
          <h3>{card.anonName}</h3>
          <p>
            <Icon name="pin" size={13} />
            {card.city}
            <span className="profile-id">{card.id}</span>
          </p>
        </div>
        <div className="card-price">
          <span>СТАРТОВАЯ ЦЕНА</span>
          <strong>от {money(card.priceFromKzt)} ₸</strong>
        </div>
      </div>
      <div className="card-explanation">
        <Icon name="spark" size={18} />
        <p>{card.explanation}</p>
      </div>
      <div className="card-bottom">
        <span className="calendar-chip">
          <Icon name="check" size={13} />
          Нет отметки о занятости
        </span>
        <span className="source-chip">
          {card.explanationSource === "llm"
            ? "AI-объяснение"
            : "Объяснение по правилам"}
        </span>
        {card.synthetic && (
          <span className="disclosure">Синтетический профиль</span>
        )}
        {card.priceImputed && (
          <span className="disclosure">Цена восстановлена</span>
        )}
        {card.cityImputed && (
          <span className="disclosure">Город восстановлен</span>
        )}
      </div>
      <details className="profile-detail">
        <summary>Фрагмент описания профиля</summary>
        <blockquote>«{card.evidence.descriptionExcerpt}»</blockquote>
        <p>
          Текст из анонимизированного набора данных; сведения не проверены
          независимо.
        </p>
      </details>
    </article>
  );
}
