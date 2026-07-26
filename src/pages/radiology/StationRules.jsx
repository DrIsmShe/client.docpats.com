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

import { useEffect, useState } from "react";

// Названия компонентов оценки по станциям. Ключи совпадают с ключами весов,
// которые сервер отдаёт в policy.scoring.weights.
const COMPONENT_LABELS = {
  detection: "Найденные изменения и их локализация",
  classification: "Правильные названия находок",
  checklist: "Полнота протокола осмотра",
  diagnosis: "Итоговый диагноз",
  aiImpression: "Свободный текст заключения",
  impression: "Свободный текст заключения",
  workup: "Путь обследования: назначил нужное, не назначил лишнего",
  prior: "Предварительная версия, названная до результатов",
  reasoning: "Свободный текст обоснования",
};

const STATIONS = {
  radiology: {
    name: "Снимки",
    task: [
      "Найти изменения на снимке и показать каждое мышью — отметка ставится там, где вы видите патологию.",
      "Назвать каждую находку из палитры и пройти протокол осмотра по областям.",
      "Написать заключение своими словами и поставить диагноз.",
    ],
    aiNote:
      "Больше всего баллов здесь даёт то, что нельзя переслать в чужую модель: находку надо найти и показать НА СНИМКЕ, в своей системе координат. Скриншот, отправленный в чат, вернёт описание словами, но не разметку.",
  },
  labs: {
    name: "Анализы",
    task: [
      "Пройти панель показателей и отметить те, где отклонение клинически значимо.",
      "Отклонение от референса и значимое отклонение — не одно и то же; оценивается второе.",
      "Написать интерпретацию и поставить диагноз.",
    ],
    aiNote:
      "На этой станции данные текстовые, и переслать их куда угодно технически несложно. Здесь работает другое: лимит времени в зачёте и то, что балл держится на выделении значимого, а не на красоте формулировки.",
  },
  vp: {
    name: "Виртуальный пациент",
    task: [
      "Прочитать жалобу и анамнез и зафиксировать предварительный дифференциальный ряд — до любых обследований.",
      "Назначать обследования по одному: результат раскрывается только после назначения, и каждое назначение записывается.",
      "Поставить итоговый диагноз и обосновать его.",
    ],
    aiNote:
      "Предварительная версия называется по одной жалобе, когда результатов ещё нет, — на таком входе чужая модель почти не помогает. Дальше оценивается путь: что вы назначили и чего не назначили. Готовый диагноз со стороны этого не заменяет.",
  },
};

function minutes(sec) {
  if (!sec) return null;
  const m = Math.round(sec / 60);
  return m >= 1 ? `${m} мин` : `${sec} с`;
}

function hours(ms) {
  return Math.round((ms ?? 0) / 3600000);
}

function whenReady(iso) {
  if (!iso) return null;
  const at = new Date(iso);
  const leftMs = at.getTime() - Date.now();
  if (leftMs <= 0) return "уже доступна";
  const h = Math.floor(leftMs / 3600000);
  const m = Math.round((leftMs % 3600000) / 60000);
  return h > 0 ? `через ${h} ч ${m} мин` : `через ${m} мин`;
}

function percent(x) {
  return `${Math.round((x ?? 0) * 100)}%`;
}

/** Из чего складывается балл — по весам, которые считает сервер. */
function ScoreBreakdown({ scoring }) {
  const weights = scoring?.weights ?? null;
  if (!weights) return null;
  const total = Object.values(weights).reduce((s, w) => s + (w ?? 0), 0) || 1;
  const rows = Object.entries(weights)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="rules-block">
      <div className="rules-h">Из чего складывается балл</div>
      <ul className="rules-list">
        {rows.map(([key, w]) => (
          <li key={key}>
            <strong>{percent(w / total)}</strong> — {COMPONENT_LABELS[key] ?? key}
          </li>
        ))}
      </ul>
      <p className="rules-note">
        Если компонент к кейсу не применим (например, автор не задал диагноз), он
        исключается из расчёта целиком, а не занижает балл. Зачёт по кейсу — от{" "}
        <strong>{percent(scoring.passThreshold)}</strong>.
      </p>
    </div>
  );
}

/**
 * Полный текст правил. Показывается развёрнутым перед стартом и доступен
 * свёрнутым во время попытки.
 */
export function RulesText({ station, policy }) {
  const meta = STATIONS[station] ?? STATIONS.labs;
  const limit = minutes(policy?.timeLimitSec) ?? minutes(policy?.examTimeLimitSec);
  const cooldownH = hours(policy?.cooldownMs);
  const repeatShare = Math.round((policy?.repeatXpFactor ?? 0.3) * 100);

  return (
    <div className="rules">
      <div className="rules-block">
        <div className="rules-h">Что нужно сделать — станция «{meta.name}»</div>
        <ul className="rules-list">
          {meta.task.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">Два режима, и они дают разное</div>
        <div className="rules-modes">
          <div className="rules-mode">
            <div className="rules-mode-h">Тренировка</div>
            <ul className="rules-list">
              <li>Времени сколько угодно, попыток сколько угодно.</li>
              <li>
                ИИ разрешён открыто: спрашивайте чат-бота, сравнивайте, разбирайте
                — это нормальный способ учиться.
              </li>
              <li>XP не начисляется, ранг и лидерборд не меняются.</li>
              <li>Средний балл кейса от тренировки не меняется.</li>
              <li>Очередь повторения не двигается.</li>
              <li>Серия дней занятий — идёт, тренировка её поддерживает.</li>
            </ul>
          </div>
          <div className="rules-mode rules-mode--exam">
            <div className="rules-mode-h">Зачёт</div>
            <ul className="rules-list">
              <li>
                Лимит времени{limit ? <> — <strong>{limit}</strong></> : null}, отсчёт
                идёт на сервере от начала попытки.
              </li>
              <li>
                Одна зачётная попытка по кейсу раз в <strong>{cooldownH} ч</strong>.
              </li>
              <li>Подсказок нет, вставка текста в поля ответа отключена.</li>
              <li>
                XP, ранг, лидерборд, достижения и статистика кейса — только отсюда.
              </li>
              <li>Слабый результат ставит кейс в очередь повторения.</li>
              <li>
                Предполагается, что отвечаете вы сами: смысл зачёта — измерить ваши
                знания, а не доступность чат-бота.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ScoreBreakdown scoring={policy?.scoring} />

      <div className="rules-block">
        <div className="rules-h">Что будет с результатом</div>
        <ul className="rules-list">
          <li>
            <strong>Первая зачётная попытка по кейсу</strong> — полный XP, кейс
            попадает в счётчик пройденных, и именно она формирует средний балл кейса.
          </li>
          <li>
            <strong>Повторная зачётная</strong> (когда пройдут {cooldownH} ч) — XP{" "}
            {repeatShare}% от обычного: улучшать результат выгодно, перепроходить
            освоенное ради очков — почти нет. Средний балл кейса она уже не меняет.
          </li>
          <li>
            <strong>Тренировка</strong> — ноль XP и никакого влияния на цифры. Разбор
            при этом полный, с эталоном автора.
          </li>
          <li>
            Ваш лучший результат по кейсу сохраняется и виден на этом экране перед
            следующей попыткой.
          </li>
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">Можно ли пройти этот кейс снова</div>
        <ul className="rules-list">
          <li>
            Да. Тренировочно — сразу и сколько угодно раз, с полным разбором.
          </li>
          <li>
            В зачёт — через {cooldownH} ч после начала предыдущей зачётной попытки.
            Пауза не наказание: повтор сразу после разбора тренирует память на
            конкретный кейс, а через сутки — уже клиническое мышление.
          </li>
          <li>
            Кейс, сданный слабо, сам вернётся в «работу над ошибками»: сначала через
            день, потом через три, потом через неделю. Пройдёте уверенно на последней
            ступени — уйдёт из очереди.
          </li>
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">Время, закрытая вкладка, прерывание</div>
        <ul className="rules-list">
          <li>
            Закрыли вкладку и вернулись в пределах лимита — продолжите ту же попытку с
            тем же таймером, ответы не потеряются.
          </li>
          <li>
            <strong>Брошенная зачётная попытка сгорает вместе со слотом:</strong>{" "}
            отсчёт {cooldownH} ч идёт от её начала. Иначе зачёт можно было бы
            отменять — начал, увидел трудный кейс, не сдал, попытка «не считается».
          </li>
          <li>
            Сдача после истечения лимита принимается — ответ и разбор вы получите, —
            но зачётность снимается: иначе лимит был бы декоративным.
          </li>
          <li>В тренировке лимита нет вообще, прерывать можно как угодно.</li>
        </ul>
      </div>

      <div className="rules-block">
        <div className="rules-h">Про ИИ — честно</div>
        <p className="rules-note">{meta.aiNote}</p>
        <ul className="rules-list">
          <li>
            В тренировке ИИ разрешён. В зачёте мы рассчитываем на ваш собственный
            ответ.
          </li>
          <li>
            Во время зачётной попытки записываются: время на кейс, вставки текста в
            поля, время вне вкладки и то, насколько ваш текст дословно совпадает с
            эталоном автора или с типовым ответом чат-бота на этот кейс.
          </li>
          <li>
            Эти пометки <strong>не меняют ваш балл</strong> и ничего не блокируют. Они
            видны автору кейса как «стоит посмотреть» — по одному сигналу выводов не
            делают, они слишком легко объясняются обычной работой.
          </li>
          <li>
            Мы не ставим прокторинг, не включаем камеру и не следим за экраном. И
            понимаем, что телефон рядом никакой браузер не увидит: задание устроено
            так, чтобы подсказка со стороны просто мало давала.
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Плашка режима: видна во время попытки и после сдачи. */
export function AttemptModeBadge({ attempt }) {
  if (!attempt) return null;
  const counted = Boolean(attempt.counted);
  const reason = attempt.countedReason;
  const text =
    reason === "first"
      ? "Зачёт · первая попытка по кейсу"
      : reason === "repeat"
        ? "Зачёт · повторная попытка"
        : reason === "cooldown"
          ? "Тренировка · зачёт по этому кейсу уже был сегодня"
          : reason === "late"
            ? "Вне зачёта · сдано после лимита времени"
            : "Тренировка · не в зачёт";

  return (
    <span className={`rules-badge ${counted ? "rules-badge--exam" : ""}`}>
      {counted ? "✓ " : "○ "}
      {text}
      {attempt.attemptNo > 1 ? ` · попытка №${attempt.attemptNo}` : ""}
    </span>
  );
}

/**
 * Обратный отсчёт зачётной попытки. Серверный дедлайн — источник истины;
 * этот таймер только показывает остаток и предупреждает.
 */
export function AttemptTimer({ deadlineAt, onExpire }) {
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
    <span className={`rules-timer ${low ? "rules-timer--low" : ""}`} title="Осталось времени">
      ⏱ {mm}:{ss}
      {left === 0 ? " — время истекло" : ""}
    </span>
  );
}

/** Что стало с попыткой после сдачи: сколько XP и почему именно столько. */
export function AttemptOutcomeNote({ attempt, game }) {
  if (!attempt) return null;
  const reason = game?.xpReason ?? (attempt.counted ? "first_counted" : "training");
  const lines = {
    first_counted: "Первая зачётная попытка по кейсу: XP начислен полностью, результат учтён в статистике кейса.",
    repeat_counted:
      "Повторная зачётная попытка: XP начислен частично, средний балл кейса не изменён — его формирует только первая зачётная.",
    training:
      "Тренировка: XP не начисляется, на статистику и очередь повторения попытка не влияет. Разбор ниже — полный.",
  };
  return (
    <div className="rules-outcome">
      <AttemptModeBadge attempt={attempt} />
      <div className="rules-note" style={{ marginTop: 6 }}>
        {attempt.lateSubmit
          ? "Сдано после истечения лимита времени: балл посчитан и разбор доступен, но в зачёт попытка не пошла."
          : lines[reason]}
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
  const meta = STATIONS[station] ?? STATIONS.labs;
  const cooldownReady = whenReady(policy?.nextCountedAt);
  const examBlocked = policy?.countedReason === "cooldown";
  const resumable = policy?.resumable && !policy.resumable.expired ? policy.resumable : null;

  return (
    <div className="rad-panel rules-wrap">
      <div className="rules-top">
        <div>
          <div className="edu-card-title" style={{ fontSize: 16 }}>
            Прежде чем начать{caseTitle ? `: ${caseTitle}` : ""}
          </div>
          <div className="edu-hint">
            Станция «{meta.name}». Ниже — все условия: что считается, что нет и что
            будет с результатом.
          </div>
        </div>
        {policy?.lastCountedScore != null && (
          <div className="rules-best">
            Ваш зачётный результат по кейсу: <strong>{percent(policy.lastCountedScore)}</strong>
          </div>
        )}
      </div>

      {resumable && (
        <div className="rules-resume">
          У вас есть незакрытая попытка по этому кейсу
          {resumable.counted ? " (зачётная)" : " (тренировочная)"} — она продолжится, а не
          начнётся заново.
        </div>
      )}

      <div className="rules-choice">
        <button
          type="button"
          className={`rules-pick ${mode === "learn" ? "rules-pick--on" : ""}`}
          onClick={() => onModeChange("learn")}
        >
          <span className="rules-pick-h">Тренировка</span>
          <span className="rules-pick-sub">
            без таймера · без ограничений по числу попыток · без XP
          </span>
        </button>
        <button
          type="button"
          className={`rules-pick ${mode === "exam" ? "rules-pick--on" : ""}`}
          onClick={() => onModeChange("exam")}
        >
          <span className="rules-pick-h">Зачёт</span>
          <span className="rules-pick-sub">
            {minutes(policy?.timeLimitSec) ?? "с таймером"} · раз в{" "}
            {hours(policy?.cooldownMs)} ч · XP, ранг и статистика
          </span>
        </button>
      </div>

      {mode === "exam" && examBlocked && (
        <div className="rules-warn">
          Зачётная попытка по этому кейсу уже была меньше {hours(policy?.cooldownMs)} часов
          назад. Следующая зачётная — {cooldownReady}. Начать сейчас можно, но эта попытка
          пойдёт как тренировка: без XP и без влияния на статистику.
        </div>
      )}

      {mode === "exam" && !examBlocked && (
        <div className="rules-warn rules-warn--ok">
          Эта попытка пойдёт в зачёт. Таймер запустится сразу и остановить его нельзя;
          брошенная попытка израсходует слот на {hours(policy?.cooldownMs)} часов.
        </div>
      )}

      {error && <div className="edu-error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="edu-btn-row" style={{ marginTop: 12 }}>
        <button type="button" className="edu-btn" onClick={onStart} disabled={busy}>
          {busy
            ? "Открываем…"
            : resumable
              ? "Продолжить попытку"
              : mode === "exam" && !examBlocked
                ? "Начать зачётную попытку"
                : "Начать тренировку"}
        </button>
        {children}
      </div>

      <RulesText station={station} policy={policy} />
    </div>
  );
}
