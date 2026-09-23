"use client";
import { useRef, useState, type FormEvent } from "react";
import { DEMOS } from "../lib/demo-cases";
import { requestSchema } from "../lib/schema";
import type { MatchRequest, MatchResponse, Options } from "../lib/types";
import { RequestForm, type FormValues } from "./RequestForm";
import { ResultsPanel } from "./ResultsPanel";
import { Icon } from "./Icons";
const toForm = (q: MatchRequest): FormValues => ({
  ...q,
  budgetKzt: String(q.budgetKzt),
  language: q.language ?? "",
  durationHours: q.durationHours == null ? "" : String(q.durationHours),
});
const toRequest = (v: FormValues) => ({
  ...v,
  budgetKzt: Number(v.budgetKzt),
  language: v.language || undefined,
  durationHours: v.durationHours === "" ? undefined : Number(v.durationHours),
});
export function MatchingApp({
  options,
  initialResult,
}: {
  options: Options;
  initialResult: MatchResponse;
}) {
  const [values, setValues] = useState<FormValues>(toForm(DEMOS.dense));
  const [result, setResult] = useState(initialResult);
  const [query, setQuery] = useState<MatchRequest>(DEMOS.dense);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [networkError, setNetworkError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef(false);
  const stale =
    JSON.stringify(toRequest(values)) !==
    JSON.stringify(toRequest(toForm(query)));
  function validate(next: FormValues) {
    const parsed = requestSchema(options).safeParse(toRequest(next));
    const fields: Record<string, string> = {};
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        fields[String(issue.path[0])] = issue.message;
    setErrors(fields);
    return parsed;
  }
  function change(key: keyof FormValues, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    validate(next);
    setNetworkError("");
  }
  async function search(next = values) {
    if (pending.current) return;
    const parsed = validate(next);
    if (!parsed.success) return;
    pending.current = true;
    setLoading(true);
    setNetworkError("");
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(12000),
      });
      const body = await response.json();
      if (!response.ok) {
        if (body.error?.fields)
          setErrors(
            Object.fromEntries(
              Object.entries(body.error.fields).map(([k, v]) => [
                k,
                (v as string[]).join("; "),
              ]),
            ),
          );
        throw new Error(body.error?.message || "Не удалось выполнить подбор");
      }
      setQuery(parsed.data);
      setResult(body);
    } catch (e) {
      setNetworkError(
        e instanceof DOMException &&
          (e.name === "TimeoutError" || e.name === "AbortError")
          ? "Сервер не ответил вовремя. Попробуйте снова."
          : e instanceof TypeError
            ? "Нет связи с сервером. Проверьте подключение и повторите."
            : e instanceof Error
              ? e.message
              : "Не удалось выполнить подбор.",
      );
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }
  function preset(q: MatchRequest) {
    const next = toForm(q);
    setValues(next);
    void search(next);
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void search();
  }
  return (
    <>
      <header className="site-header">
        <a href="/" className="wordmark" aria-label="QADAM — главная">
          QADAM<span>↗</span>
        </a>
        <nav aria-label="Основная навигация">
          <a href="#matching" className="active">
            Подбор подрядчиков
          </a>
          <a href="#how-it-works">Как это работает</a>
        </nav>
        <span className="header-tag">
          <span />
          HACKALEM 2026
        </span>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="tiny-line" />
              УМНЫЙ ПОДБОР ПОДРЯДЧИКОВ
            </p>
            <h1>
              Ваше событие.
              <br />
              <span>Подходящие люди.</span>
            </h1>
            <p className="hero-subtitle">
              Меньше поисков — больше совпадений. Найдите до трёх
              <br className="desktop-break" /> подрядчиков под ваш формат,
              бюджет и дату.
            </p>
            <div className="hero-meta">
              <span>
                <Icon name="pin" size={14} />
                Каталог Казахстана
              </span>
              <span>
                <Icon name="calendar" size={14} />
                Сентябрь — декабрь 2026
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="orbit-dot" />
            <div className="event-ticket">
              <div className="ticket-top">
                <span>ВАШЕ СОБЫТИЕ</span>
                <Icon name="spark" />
              </div>
              <div className="ticket-date">
                10
                <span>
                  ОКТЯБРЯ
                  <br />
                  2026
                </span>
              </div>
              <div className="ticket-rule" />
              <div className="ticket-bottom">
                <span className="ticket-check">✓</span>Всё совпало<span>↗</span>
              </div>
            </div>
            <span className="float-label">
              <span />
              Дата. Бюджет. Формат.
            </span>
            <span className="visual-plus">+</span>
          </div>
        </section>
        <section className="demo-strip" aria-label="Демонстрационные запросы">
          <div>
            <span className="demo-indicator" />
            <strong>Попробуйте на примере</strong>
            <span className="demo-caption">
              Реальные сценарии из набора данных
            </span>
          </div>
          <div className="demo-buttons">
            <button disabled={loading} onClick={() => preset(DEMOS.dense)}>
              Много вариантов <span>↗</span>
            </button>
            <button disabled={loading} onClick={() => preset(DEMOS.sparse)}>
              Редкая категория <span>↗</span>
            </button>
            <button disabled={loading} onClick={() => preset(DEMOS.empty)}>
              Нет результата <span>↗</span>
            </button>
          </div>
        </section>
        <div className="matching-layout" id="matching">
          <aside>
            <RequestForm
              options={options}
              values={values}
              errors={errors}
              loading={loading}
              onChange={change}
              onSubmit={submit}
            />
            <div className="date-demo">
              <Icon name="calendar" size={19} />
              <h3>Один день меняет подбор</h3>
              <p>
                Фотографы в Алматы: сравните доступность на две соседние даты.
              </p>
              <button
                disabled={loading}
                onClick={() =>
                  preset(
                    query.category === "Фотограф" &&
                      query.eventDate === "2026-10-10"
                      ? DEMOS.dateB
                      : DEMOS.dateA,
                  )
                }
              >
                {query.category === "Фотограф" &&
                query.eventDate === "2026-10-10"
                  ? "Проверить 11 октября"
                  : "Проверить 10 октября"}{" "}
                <span>→</span>
              </button>
              <button
                className="venue-demo"
                disabled={loading}
                onClick={() => preset(DEMOS.busyVenue)}
              >
                Пример: занятый банкетный зал
              </button>
            </div>
          </aside>
          <div>
            {networkError && (
              <div className="network-error" role="alert">
                <p>{networkError}</p>
                <button onClick={() => void search()} disabled={loading}>
                  Повторить запрос
                </button>
              </div>
            )}
            <ResultsPanel
              result={result}
              query={query}
              loading={loading}
              stale={stale}
            />
          </div>
        </div>
        <section className="how-it-works" id="how-it-works">
          <div className="how-heading">
            <p className="eyebrow">ПРОЗРАЧНО НА КАЖДОМ ШАГЕ</p>
            <h2>Совпадения, которым есть объяснение.</h2>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Смотрим каталог",
                "Находим профили в выбранном городе и категории.",
              ],
              [
                "02",
                "Проверяем условия",
                "Сверяем дату, бюджет, формат, язык и длительность.",
              ],
              [
                "03",
                "Сравниваем варианты",
                "Стабильно ранжируем и показываем до трёх совпадений.",
              ],
              [
                "04",
                "Объясняем выбор",
                "Факты из профиля — в объяснении AI или по правилам.",
              ],
            ].map(([n, title, body]) => (
              <div className="step" key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <a href="/" className="wordmark">
          QADAM<span>↗</span>
        </a>
        <p>Первый шаг к вашему событию.</p>
        <span>HACKALEM AI 2026 · TRACK 79-LITE</span>
      </footer>
    </>
  );
}
