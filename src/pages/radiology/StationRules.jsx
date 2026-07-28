// client/src/pages/radiology/StationRules.jsx
//
// ПРАВИЛА ЗАДАНИЯ, напечатанные врачу словами: что делать, что считается,
// что будет с результатом, можно ли пройти снова и что система записывает.
//
// Почему это отдельный экран перед стартом, а не подсказка внизу страницы:
// зачётная попытка расходует слот «раз в 24 часа» с момента НАЧАЛА и сгорает,
// если её бросить. Условие, о котором узнают после ответа, условием не
// является — поэтому сначала расклад, потом кнопка.
//
// Все цифры (лимит времени, вес компонентов, проходной балл, срок до
// следующего зачёта) берутся из policy, которую считает сервер
// (attemptPolicy.js). Своей копии правил здесь нет намеренно: разъехавшиеся
// правила хуже отсутствующих.
//
// ТЕКСТОВ В ЭТОМ ФАЙЛЕ НЕТ — только ключи из public/locales/<lang>/arena.json.
// Это экран условий: он решает, сгорит ли попытка и начислится ли XP. Условие,
// показанное на языке, которого врач не знает, условием тоже не является.
// Абзацы с выделением внутри предложения собираются через <Trans>: порядок
// слов в турецком и арабском другой, и вынести <strong> за пределы строки
// нельзя — выделение уехало бы не на то слово.

import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

// Ключи компонентов оценки совпадают с ключами весов, которые сервер отдаёт
// в policy.scoring.weights.
const COMPONENT_KEYS = [
  "detection",
  "classification",
  "checklist",
  "diagnosis",
  "aiImpression",
  "impression",
  "workup",
  "prior",
  "reasoning",
];

const STATION_KEYS = ["radiology", "labs", "vp"];

/** Подпись компонента оценки; неизвестный ключ показываем как есть. */
function componentLabel(t, key) {
  if (!COMPONENT_KEYS.includes(key)) return key;
  return t(`rules.comp.${key}`);
}

/** Станция; незнакомую трактуем как «Анализы» — так было и раньше. */
function stationKey(station) {
  return STATION_KEYS.includes(station) ? station : "labs";
}

function minutes(t, sec) {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  return m >= 1 ? t("rules.min", { n: m }) : t("rules.sec", { n: sec });
}

function hours(ms) {
  return Math.round((ms ?? 0) / 3600000);
}

function whenReady(t, iso) {
  if (!iso) return null;
  const at = new Date(iso);
  const leftMs = at.getTime() - Date.now();
  if (leftMs <= 0) return t("rules.availableNow");
  const h = Math.floor(leftMs / 3600000);
  const m = Math.round((leftMs % 3600000) / 60000);
  return h > 0 ? t("rules.inHm", { h, m }) : t("rules.inM", { m });
}

function percent(x) {
  return `${Math.round((x ?? 0) * 100)}%`;
}

/** Из чего складывается балл — по весам, которые считает сервер. */
function ScoreBreakdown({ scoring }) {
  const { t } = useTranslation("arena");
  const weights = scoring?.weights ?? null;
  if (!weights) return null;
  const total = Object.values(weights).reduce((s, w) => s + (w ?? 0), 0) || 1;
  const rows = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="rules-block">
      <div className="rules-h">{t("rules.scoreH")}</div>
      <ul className="rules-list">
        {rows.map(([key, w]) => (
          <li key={key}>
            <strong>{percent(w / total)}</strong> — {componentLabel(t, key)}
          </li>
        ))}
      </ul>
      <p className="rules-note">
        <Trans
          t={t}
          i18nKey="rules.scoreNote"
          values={{ threshold: percent(scoring.passThreshold) }}
          components={{ b: <strong /> }}
        />
      </p>
    </div>
  );
}

/**
 * Полный текст правил. Показывается развёрнутым перед стартом и доступен
 * свёрнутым во время попытки.
 */
export function RulesText({ station, policy }) {
  const { t } = useTranslation("arena");
  const st = stationKey(station);
  const limit = minutes(t, policy?.timeLimitSec) ?? minutes(t, policy?.examTimeLimitSec);
  const cooldownH = hours(policy?.cooldownMs);
  const repeatShare = Math.round((policy?.repeatXpFactor ?? 0.3) * 100);

  return (
    <div className="rules">
      <div className="rules-block">
        <div className="rules-h">
          {t("rules.taskH", { station: t(`rules.station.${st}.name`) })}
        </div>
        <ul className="rules-list">
          {["t1", "t2", "t3"].map((k) => (
            <li key={k}>{t(`rules.station.${st}.${k}`)}</li>
          ))}
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">{t("rules.modesH")}</div>
        <div className="rules-modes">
          <div className="rules-mode">
            <div className="rules-mode-h">{t("rules.learn")}</div>
            <ul className="rules-list">
              <li>{t("rules.learn1")}</li>
              <li>{t("rules.learn2")}</li>
              <li>{t("rules.learn3")}</li>
              <li>{t("rules.learn4")}</li>
              <li>{t("rules.learn5")}</li>
              <li>{t("rules.learn6")}</li>
            </ul>
          </div>
          <div className="rules-mode rules-mode--exam">
            <div className="rules-mode-h">{t("rules.exam")}</div>
            <ul className="rules-list">
              <li>
                {limit ? (
                  <Trans
                    t={t}
                    i18nKey="rules.exam1"
                    values={{ limit }}
                    components={{ b: <strong /> }}
                  />
                ) : (
                  t("rules.exam1NoLimit")
                )}
              </li>
              <li>
                <Trans
                  t={t}
                  i18nKey="rules.exam2"
                  values={{ hours: cooldownH }}
                  components={{ b: <strong /> }}
                />
              </li>
              <li>{t("rules.exam3")}</li>
              <li>{t("rules.exam4")}</li>
              <li>{t("rules.exam5")}</li>
              <li>{t("rules.exam6")}</li>
            </ul>
          </div>
        </div>
      </div>

      <ScoreBreakdown scoring={policy?.scoring} />

      <div className="rules-block">
        <div className="rules-h">{t("rules.outcomeH")}</div>
        <ul className="rules-list">
          <li>
            <Trans t={t} i18nKey="rules.outcome1" components={{ b: <strong /> }} />
          </li>
          <li>
            <Trans
              t={t}
              i18nKey="rules.outcome2"
              values={{ hours: cooldownH, share: repeatShare }}
              components={{ b: <strong /> }}
            />
          </li>
          <li>
            <Trans t={t} i18nKey="rules.outcome3" components={{ b: <strong /> }} />
          </li>
          <li>{t("rules.outcome4")}</li>
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">{t("rules.againH")}</div>
        <ul className="rules-list">
          <li>{t("rules.again1")}</li>
          <li>{t("rules.again2", { hours: cooldownH })}</li>
          <li>{t("rules.again3")}</li>
          {policy?.variantCount > 0 && (
            <li>
              <Trans
                t={t}
                i18nKey="rules.again4"
                values={{ count: policy.variantCount + 1 }}
                components={{ b: <strong /> }}
              />
            </li>
          )}
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">{t("rules.timeH")}</div>
        <ul className="rules-list">
          <li>{t("rules.time1")}</li>
          <li>
            <Trans
              t={t}
              i18nKey="rules.time2"
              values={{ hours: cooldownH }}
              components={{ b: <strong /> }}
            />
          </li>
          <li>{t("rules.time3")}</li>
          <li>{t("rules.time4")}</li>
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">{t("rules.aiH")}</div>
        <p className="rules-note">{t(`rules.station.${st}.ai`)}</p>
        <ul className="rules-list">
          <li>{t("rules.ai1")}</li>
          <li>{t("rules.ai2")}</li>
          <li>
            <Trans t={t} i18nKey="rules.ai3" components={{ b: <strong /> }} />
          </li>
          <li>{t("rules.ai4")}</li>
        </ul>
      </div>
    </div>
  );
}

/** Плашка режима: видна во время попытки и после сдачи. */
export function AttemptModeBadge({ attempt }) {
  const { t } = useTranslation("arena");
  if (!attempt) return null;
  const counted = Boolean(attempt.counted);
  const reason = attempt.countedReason;
  const known = ["first", "repeat", "cooldown", "late"].includes(reason);
  const text = t(`rules.badge.${known ? reason : "training"}`);

  return (
    <span className={`rules-badge ${counted ? "rules-badge--exam" : ""}`}>
      {counted ? "✓ " : "○ "}
      {text}
      {attempt.attemptNo > 1 ? ` · ${t("rules.badge.attemptNo", { n: attempt.attemptNo })}` : ""}
    </span>
  );
}

/**
 * Обратный отсчёт зачётной попытки. Серверный дедлайн — источник истины;
 * этот таймер только показывает остаток и предупреждает.
 */
export function AttemptTimer({ deadlineAt, onExpire }) {
  const { t } = useTranslation("arena");
  const [left, setLeft] = useState(() =>
    deadlineAt ? Math.max(0, Math.round((new Date(deadlineAt) - Date.now()) / 1000)) : null,
  );

  useEffect(() => {
    if (!deadlineAt) return undefined;
    const tick = () => {
      const s = Math.max(0, Math.round((new Date(deadlineAt) - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && onExpire) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineAt, onExpire]);

  if (left == null) return null;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const low = left <= 60;

  return (
    <span
      className={`rules-timer ${low ? "rules-timer--low" : ""}`}
      title={t("rules.timerTitle")}
    >
      {/* Часы:минуты не зеркалим в арабской версии: 04:31 читается одинаково,
          а перевёрнутая запись выглядела бы как 31:04. */}
      <bdi dir="ltr">
        ⏱ {mm}:{ss}
      </bdi>
      {left === 0 ? ` — ${t("rules.timeUp")}` : ""}
    </span>
  );
}

/** Что стало с попыткой после сдачи: сколько XP и почему именно столько. */
export function AttemptOutcomeNote({ attempt, game }) {
  const { t } = useTranslation("arena");
  if (!attempt) return null;
  const reason = game?.xpReason ?? (attempt.counted ? "first_counted" : "training");
  const known = ["first_counted", "repeat_counted", "training"].includes(reason);

  return (
    <div className="rules-outcome">
      <AttemptModeBadge attempt={attempt} />
      <div className="rules-note" style={{ marginTop: 6 }}>
        {attempt.lateSubmit
          ? t("rules.note.late")
          : t(`rules.note.${known ? reason : "training"}`)}
      </div>
    </div>
  );
}

/**
 * Экран перед стартом: полный расклад + выбор режима + кнопка.
 *
 * @param {object} p
 * @param {"radiology"|"labs"|"vp"} p.station
 * @param {object} p.policy   ответ сервера про условия попытки
 * @param {string} p.mode     выбранный режим
 */
export default function StationBriefing({
  station,
  policy,
  mode,
  onModeChange,
  onStart,
  busy,
  error,
  caseTitle,
  children,
}) {
  const { t } = useTranslation("arena");
  const st = stationKey(station);
  const stationName = t(`rules.station.${st}.name`);
  const cooldownReady = whenReady(t, policy?.nextCountedAt);
  const cooldownH = hours(policy?.cooldownMs);
  const examBlocked = policy?.countedReason === "cooldown";
  const resumable = policy?.resumable && !policy.resumable.expired ? policy.resumable : null;

  return (
    <div className="rad-panel rules-wrap">
      <div className="rules-top">
        <div>
          <div className="edu-card-title" style={{ fontSize: 16 }}>
            {caseTitle
              ? t("rules.beforeStartCase", { title: caseTitle })
              : t("rules.beforeStart")}
          </div>
          <div className="edu-hint">{t("rules.stationHint", { station: stationName })}</div>
        </div>
        {policy?.lastCountedScore != null && (
          <div className="rules-best">
            <Trans
              t={t}
              i18nKey="rules.yourBest"
              values={{ score: percent(policy.lastCountedScore) }}
              components={{ b: <strong /> }}
            />
          </div>
        )}
      </div>

      {resumable && (
        <div className="rules-resume">
          {resumable.counted ? t("rules.resumeExam") : t("rules.resumeLearn")}
        </div>
      )}

      <div className="rules-choice">
        <button
          type="button"
          className={`rules-pick ${mode === "learn" ? "rules-pick--on" : ""}`}
          onClick={() => onModeChange("learn")}
        >
          <span className="rules-pick-h">{t("rules.learn")}</span>
          <span className="rules-pick-sub">{t("rules.pickLearnSub")}</span>
        </button>
        <button
          type="button"
          className={`rules-pick ${mode === "exam" ? "rules-pick--on" : ""}`}
          onClick={() => onModeChange("exam")}
        >
          <span className="rules-pick-h">{t("rules.exam")}</span>
          <span className="rules-pick-sub">
            {t("rules.pickExamSub", {
              limit: minutes(t, policy?.timeLimitSec) ?? t("rules.withTimer"),
              hours: cooldownH,
            })}
          </span>
        </button>
      </div>

      {mode === "exam" && examBlocked && (
        <div className="rules-warn">
          {t("rules.warnBlocked", { hours: cooldownH, when: cooldownReady })}
        </div>
      )}

      {mode === "exam" && !examBlocked && (
        <div className="rules-warn rules-warn--ok">{t("rules.warnOk", { hours: cooldownH })}</div>
      )}

      {error && <div className="edu-error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="edu-btn-row" style={{ marginTop: 12 }}>
        <button type="button" className="edu-btn" onClick={onStart} disabled={busy}>
          {busy
            ? t("rules.btnOpening")
            : resumable
              ? t("rules.btnResume")
              : mode === "exam" && !examBlocked
                ? t("rules.btnExam")
                : t("rules.btnLearn")}
        </button>
        {children}
      </div>

      <RulesText station={station} policy={policy} />
    </div>
  );
}
