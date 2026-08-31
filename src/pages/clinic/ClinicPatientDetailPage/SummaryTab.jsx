// client/src/pages/clinic/ClinicPatientDetailPage/SummaryTab.jsx
//
// Сводка пациента — один экран вместо двенадцати вкладок.
//
// ЗАЧЕМ. Карта разложена по восьми разделам, каждый устроен как форма
// для ЗАПОЛНЕНИЯ. Ни один не отвечает на вопрос, с которым врач её
// открывает: «что мне про этого человека важно знать прямо сейчас».
// Врач не обойдёт восемь вкладок перед приёмом — он откроет самую
// нужную и пропустит аллергию, лежащую в соседней.
//
// ПОРЯДОК БЛОКОВ — НЕ ОФОРМЛЕНИЕ, А КЛИНИКА. Сверху то, незнание чего
// вредит быстрее всего:
//   1. аллергии          — убивают за минуты
//   2. критические анализы — требуют звонка сегодня
//   3. что принимает      — определяет, что можно назначить
//   4. хронические        — меняют тактику
//   5. отклонения в анализах, приёмы, прочее
//
// НИЧЕГО НЕ ПЕРЕСКАЗЫВАЕТСЯ. Сервер отдаёт поля записей как есть,
// экран их показывает как есть. Модель к этому экрану не подпускается:
// пересказ карты может потерять аллергию и будет выглядеть так же
// убедительно, как правильный ответ (подробнее — в комментарии
// patientSummary.service.js).

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../../axios";
import "./summaryTab.css";

const API = "/api/v1/clinic/medical";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

/** Стрелка динамики. Знак важнее числа: врач смотрит «куда идёт». */
function Trend({ trend }) {
  const { t } = useTranslation("clinic");
  if (!trend || trend.direction === "same") return null;
  const up = trend.direction === "up";
  return (
    <span className={`sum-trend ${up ? "is-up" : "is-down"}`}>
      {up ? "↑" : "↓"}
      {trend.percent !== null && trend.percent !== undefined
        ? ` ${Math.abs(trend.percent)}%`
        : ""}
      <span className="sum-trend__prev">{t("summary.was")} {trend.previous}</span>
    </span>
  );
}

function LabRow({ item }) {
  const { t } = useTranslation("clinic");
  const range = item.referenceRange;
  const rangeText =
    range && (range.min !== null || range.max !== null)
      ? `${range.min ?? "…"}–${range.max ?? "…"}`
      : range?.text || null;

  return (
    <li
      className={`sum-lab ${item.isCritical ? "is-critical" : item.isAbnormal ? "is-abnormal" : ""}`}
    >
      <span className="sum-lab__name">{item.name}</span>
      <span className="sum-lab__value">
        {String(item.value)}
        {item.unit ? ` ${item.unit}` : ""}
      </span>
      {rangeText && <span className="sum-lab__range">{t("summary.norm")} {rangeText}</span>}
      <Trend trend={item.trend} />
      <span className="sum-lab__date">{fmtDate(item.measuredAt)}</span>
    </li>
  );
}

/**
 * Блок сводки.
 *
 * Пустой раздел показывается серой строкой «нет записей», а НЕ
 * скрывается. Отсутствие блока читается как «я не смотрел», а пустой
 * блок — как «здесь пусто»; в медицинской карте это разные утверждения.
 */
function Block({ title, items, empty, tone, render }) {
  return (
    <section className={`sum-block ${tone ? `sum-block--${tone}` : ""}`}>
      <h3 className="sum-block__title">
        {title}
        {items.length > 0 && (
          <span className="sum-block__count">{items.length}</span>
        )}
      </h3>
      {items.length === 0 ? (
        <p className="sum-block__empty">{empty}</p>
      ) : (
        <ul className="sum-block__list">{items.map(render)}</ul>
      )}
    </section>
  );
}

export default function SummaryTab({ patient }) {
  const { t } = useTranslation("clinic");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const patientId = patient?._id || patient?.id;

  const load = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `${API}/patients/${patientId}/summary`,
      );
      setSummary(data.summary);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? t("summary.loadFailed", { defaultValue: "Не удалось загрузить сводку" }),
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="sum-hint">{t("summary.loading")}</p>;
  if (error) return <p className="sum-error">{error}</p>;
  if (!summary) return null;

  const critical = summary.labs.all.filter((i) => i.isCritical);
  const abnormal = summary.labs.abnormal.filter((i) => !i.isCritical);

  return (
    <div className="sum-grid">
      {/* Анкета перед приёмом — первой, если она есть. Это рассказ
          пациента, собранный до встречи; врач читает его до осмотра, и
          класть его ниже аллергий бессмысленно — он про то, ЗАЧЕМ
          человек пришёл сегодня. */}
      {summary.previsit && (
        <section className="sum-block sum-block--previsit">
          <h3 className="sum-block__title">
            {t("summary.previsit")}
            <span className="sum-block__count">
              {fmtDate(summary.previsit.submittedAt)}
            </span>
          </h3>

          {summary.previsit.redFlags.some((f) => f.urgent) && (
            <p className="sum-previsit__urgent">
              {t("summary.marked")}{" "}
              {summary.previsit.redFlags
                .filter((f) => f.urgent)
                .map((f) => f.label)
                .join(", ")}
            </p>
          )}

          {summary.previsit.narrative && (
            <p className="sum-previsit__narrative">
              {summary.previsit.narrative}
            </p>
          )}

          {summary.previsit.clarify.length > 0 && (
            <ul className="sum-previsit__clarify">
              {summary.previsit.clarify.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}

          {/* Исходные ответы — всегда доступны. Пересказ полезен, но
              слова пациента точнее, и врач должен иметь к ним доступ
              в один клик, а не через другую вкладку. */}
          <details className="sum-previsit__raw">
            <summary>{t("summary.previsitVerbatim")}</summary>
            <ul>
              {summary.previsit.answers.map((a, i) => (
                <li key={i}>
                  <strong>{a.label}</strong> {a.value}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* Аллергии первыми и всегда — единственный раздел карты,
          незнание которого убивает в течение минут. */}
      <Block
        title={t("summary.allergies")}
        tone="danger"
        items={summary.allergies}
        empty={t("summary.emptyAllergies", { defaultValue: "Аллергии не зафиксированы" })}
        render={(a) => (
          <li key={a.id} className="sum-item">
            <span>{a.content}</span>
            <span className="sum-item__date">{fmtDate(a.recordedAt)}</span>
          </li>
        )}
      />

      {critical.length > 0 && (
        <Block
          title={t("summary.critical")}
          tone="danger"
          items={critical}
          empty=""
          render={(i) => <LabRow key={i.key} item={i} />}
        />
      )}

      <Block
        title={t("summary.currentMeds")}
        items={summary.prescriptions}
        empty={t("summary.emptyMedications", { defaultValue: "Действующих назначений нет" })}
        render={(p) => (
          <li key={p.id} className="sum-item">
            <span>
              {p.medication || "—"}
              {p.dosage ? `, ${p.dosage}` : ""}
            </span>
            <span className="sum-item__date">{fmtDate(p.prescribedAt)}</span>
          </li>
        )}
      />

      <Block
        title={t("summary.chronic")}
        items={summary.chronic}
        empty={t("summary.emptyNone", { defaultValue: "Не зафиксированы" })}
        render={(c) => (
          <li key={c.id} className="sum-item">
            <span>{c.content}</span>
            <span className="sum-item__date">{fmtDate(c.recordedAt)}</span>
          </li>
        )}
      />

      <Block
        title={t("summary.labDeviations")}
        tone="warn"
        items={abnormal}
        empty={
          summary.labs.panelsScanned === 0
            ? t("summary.emptyLabs", { defaultValue: "Анализов нет" })
            : t("summary.noAbnormal", { defaultValue: "Отклонений нет" })
        }
        render={(i) => <LabRow key={i.key} item={i} />}
      />

      <Block
        title={t("summary.encounters", { defaultValue: "Последние приёмы" })}
        items={summary.encounters}
        empty={t("summary.emptyEncounters", { defaultValue: "Приёмов не было" })}
        render={(e) => (
          <li key={e.id} className="sum-item">
            <span>
              {e.diagnosis || t("summary.noDiagnosis", { defaultValue: "без диагноза" })}
              {e.code ? ` (${e.code})` : ""}
            </span>
            <span className="sum-item__date">{fmtDate(e.date)}</span>
          </li>
        )}
      />

      <Block
        title={t("summary.operations")}
        items={summary.operations}
        empty={t("summary.emptyNone", { defaultValue: "Не зафиксированы" })}
        render={(o) => (
          <li key={o.id} className="sum-item">
            <span>{o.content}</span>
            <span className="sum-item__date">{fmtDate(o.recordedAt)}</span>
          </li>
        )}
      />

      <Block
        title={t("summary.family")}
        items={summary.familyHistory}
        empty={t("summary.emptyFemale", { defaultValue: "Не зафиксирована" })}
        render={(f) => (
          <li key={f.id} className="sum-item">
            <span>{f.content}</span>
          </li>
        )}
      />

      <Block
        title={t("summary.immunization", { defaultValue: "Прививки" })}
        items={summary.immunization}
        empty={t("summary.emptyNone", { defaultValue: "Не зафиксированы" })}
        render={(i) => (
          <li key={i.id} className="sum-item">
            <span>{i.content}</span>
            <span className="sum-item__date">{fmtDate(i.recordedAt)}</span>
          </li>
        )}
      />

      {/* Прямо сказать, что это выжимка, а не вся карта: врач должен
          знать, где кончается сводка и начинается первоисточник. */}
      <p className="sum-footnote">
        {t("summary.footnote", {
          defaultValue:
            "Сводка собрана из записей карты без пересказа. Полные разделы — на соседних вкладках.",
        })}
      </p>
    </div>
  );
}
