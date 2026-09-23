import type { FormEvent } from "react";
import type { Options } from "../lib/types";
import { MAX_DATE, MIN_DATE } from "../lib/types";
import { Icon } from "./Icons";
export type FormValues = {
  city: string;
  eventDate: string;
  eventFormat: string;
  category: string;
  budgetKzt: string;
  language: string;
  durationHours: string;
};
export function RequestForm({
  options,
  values,
  errors,
  loading,
  onChange,
  onSubmit,
}: {
  options: Options;
  values: FormValues;
  errors: Record<string, string>;
  loading: boolean;
  onChange: (key: keyof FormValues, value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const field = (key: keyof FormValues) => ({
    id: key,
    name: key,
    value: values[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange(key, e.target.value),
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });
  const error = (key: keyof FormValues) =>
    errors[key] ? (
      <span className="field-error" id={`${key}-error`}>
        {errors[key]}
      </span>
    ) : null;
  const choices = (list: string[]) =>
    list.map((v) => (
      <option key={v} value={v}>
        {v}
      </option>
    ));
  return (
    <form onSubmit={onSubmit} className="request-form" noValidate>
      <div className="form-heading">
        <span className="form-icon">
          <Icon name="sliders" />
        </span>
        <div>
          <h2>Расскажите о событии</h2>
          <p>Мы проверим всё остальное</p>
        </div>
      </div>
      <fieldset disabled={loading}>
        <div className="field">
          <label htmlFor="city">Город</label>
          <select {...field("city")}>{choices(options.cities)}</select>
          {error("city")}
          {values.city === "Зарубежье" && (
            <span className="field-hint">
              Значение исходного каталога, не город Казахстана.
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor="eventDate">Дата мероприятия</label>
          <input
            type="date"
            min={MIN_DATE}
            max={MAX_DATE}
            required
            {...field("eventDate")}
          />
          {error("eventDate")}
          <span className="field-hint">
            Календарь: 23 сентября — 31 декабря 2026
          </span>
        </div>
        <div className="field">
          <label htmlFor="eventFormat">Формат события</label>
          <select {...field("eventFormat")}>
            {choices(options.eventFormats)}
          </select>
          {error("eventFormat")}
        </div>
        <div className="field">
          <label htmlFor="category">Кого ищем?</label>
          <select {...field("category")}>{choices(options.categories)}</select>
          {error("category")}
        </div>
        <div className="field">
          <label htmlFor="budgetKzt">
            Бюджет <span>до</span>
          </label>
          <div className="input-suffix">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="1000000000"
              step="1"
              required
              {...field("budgetKzt")}
            />
            <span>₸</span>
          </div>
          {error("budgetKzt")}
          <span className="field-hint">На одного подрядчика, в тенге</span>
        </div>
        <div className="optional-divider">
          <span>ДОПОЛНИТЕЛЬНО</span>
          <span>необязательно</span>
        </div>
        <div className="optional-fields">
          <div className="field">
            <label htmlFor="language">Язык</label>
            <select {...field("language")}>
              <option value="">Любой</option>
              {choices(options.languages)}
            </select>
            {error("language")}
          </div>
          <div className="field">
            <label htmlFor="durationHours">Длительность</label>
            <div className="input-suffix">
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="168"
                step="1"
                placeholder="Любая"
                {...field("durationHours")}
              />
              <span>ч</span>
            </div>
            {error("durationHours")}
          </div>
        </div>
        <button type="submit" className="primary-button">
          {loading ? "Подбираем…" : "Подобрать подрядчиков"}
          {loading ? (
            <span className="spinner" />
          ) : (
            <Icon name="arrow" size={18} />
          )}
        </button>
      </fieldset>
      <p className="form-footnote">
        <Icon name="check" size={13} />
        Только совпадения со всеми условиями
      </p>
    </form>
  );
}
