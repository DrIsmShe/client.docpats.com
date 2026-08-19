// client/src/pages/communication/components/ScribePanel.jsx
//
// Панель записи приёма во время видеозвонка.
//
// Показывается ОБЕИМ сторонам, но выглядит по-разному:
//
//   врач    — кнопка «Вести запись приёма», таймер, «Завершить»;
//   пациент — запрос согласия, а после согласия постоянный индикатор
//             «идёт запись» с кнопкой «Прекратить».
//
// ПОЧЕМУ ИНДИКАТОР ПОСТОЯННЫЙ. Человек, забывший о записи, не может
// считаться согласившимся на неё: согласие даётся на то, что помнишь.
// Полоса висит всё время, пока пишется звук, и убрать её нельзя.
//
// ПОЧЕМУ КНОПКА «ПРЕКРАТИТЬ» У ПАЦИЕНТА, А НЕ ТОЛЬКО У ВРАЧА. Прервать
// запись должен тот, кого записывают. Право, которым распоряжается
// вторая сторона, — не право.

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../../axios";
import useScribeRecorder, {
  currentLang,
  canRecordHere,
} from "../hooks/useScribeRecorder";
import "./scribePanel.css";

const API = "/api/v1/scribe";

// ─── ЯЗЫК ПРИЁМА ───────────────────────────────────────────────────────
//
// Спрашиваем явно, а не берём из интерфейса. Язык страницы и язык разговора
// расходятся сплошь и рядом: врач с русским интерфейсом ведёт приём
// по-азербайджански. Для распознавателя это не мелочь — на неверно
// угаданном языке он не ошибается по мелочи, а выдаёт связную чушь:
// азербайджанская речь возвращалась русской транслитерацией
// («хайрус, латин, маэрхан»), похожей на текст ровно настолько, чтобы
// её можно было принять за расшифровку.
//
// ЯЗЫКИ РАСПОЗНАВАНИЯ — НЕ ЯЗЫКИ ИНТЕРФЕЙСА, и связывать их нельзя.
// Интерфейс переведён на пять языков: это решение продуктовое. Whisper
// понимает около сотни: это возможность модели. Приём на испанском бывает
// и в клинике с русским интерфейсом.
//
// Поэтому первым пунктом стоит «Определить автоматически», и это не
// запасной вариант, а честный ответ для всего, чего нет в списке. Пустой
// язык означает «решай сам»: на языках, которые модель знает хорошо
// (испанский, французский, немецкий), она справляется без подсказки.
// Подставить вместо этого русский было бы худшим из возможных ответов —
// на неверно названном языке распознаватель выдаёт не «неточно», а связную
// чушь: азербайджанская речь возвращалась русской транслитерацией.
//
// Список ниже — не предел возможностей, а короткий путь к частым языкам.
// Подписи на самих языках: выбирает тот, кто на этом языке и говорит.
//
// «Авто» переводится (ключ i18n), названия языков — нет: каждый написан на
// себе самом, и переводить «Türkçe» на турецкий незачем.
const SPEECH_LANGS = [
  { code: "", key: "langAuto", label: "Определить автоматически" },
  { code: "az", label: "Azərbaycanca" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "fa", label: "فارسی" },
  { code: "ka", label: "ქართული" },
  { code: "uk", label: "Українська" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

// Пункты согласия — порядком, а не вёрсткой. Текст каждого лежит в словаре
// двумя ключами: выделенное начало и продолжение. Разметка внутри
// переводимой строки заставила бы переводчика таскать теги, а порядок слов
// в языках разный.
const CONSENT_FACTS = ["audio", "ownMic", "stop", "before", "card"];

// Советы врачу — так же двумя ключами. Последний пункт идёт без выделения
// и отдельной строкой.
const HOW_ITEMS = ["headphones", "mic", "distance"];

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ScribePanel({
  role, // "doctor" | "patient"
  room,
  peerUserId, // для врача: userId пациента (звонок из переписки)
  peerName = "", // имя собеседника — для создания карты одним нажатием
  telemedSessionId = null, // телемед-приём: карта известна ему заранее
  onDraft, // врач: получить черновик после завершения
}) {
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  // Язык интерфейса — только начальное значение переключателя, а не ответ.
  // Нет его в списке — начинаем с автоопределения, а не с русского: угадать
  // мимо здесь дороже, чем не угадывать вовсе.
  const [speechLang, setSpeechLang] = useState(
    () => SPEECH_LANGS.find((l) => l.code === currentLang())?.code ?? "",
  );
  // Русский текст остаётся вторым аргументом t(): пока словарь грузится по
  // сети, показывается он, а не голый ключ. Так же сделано в DictationPanel.
  const { t } = useTranslation("Communication");
  const rec = useScribeRecorder();
  const pollRef = useRef(null);
  // Считаем один раз: устройство посреди приёма не меняется.
  const canRecord = useRef(canRecordHere()).current;
  const toldUnsupportedRef = useRef(false);
  const [mics, setMics] = useState([]);
  const [micId, setMicId] = useState("");

  const isDoctor = role === "doctor";

  // Список микрофонов — только врачу и только на пригодном устройстве.
  //
  // Названия браузер отдаёт лишь после выданного разрешения: до него все
  // пункты безымянные. Поэтому если имён нет, показываем не пустой список,
  // а кнопку «Показать микрофоны» — она спросит доступ и перечитает.
  const refreshMics = useCallback(async () => {
    const list = await rec.listDevices();
    setMics(list);
    return list;
  }, [rec]);

  useEffect(() => {
    if (!isDoctor || !canRecord) return;
    refreshMics();
  }, [isDoctor, canRecord, refreshMics]);

  // Сообщаем серверу, что писать с этого устройства нельзя.
  //
  // Отдельным путём, а не отказом: телефон ничего не решает, он не умеет, а
  // «отказался» — решение человека и закрывает сеанс безвозвратно. Врачу это
  // нужно, чтобы не ждать ответа, которого не будет.
  useEffect(() => {
    if (canRecord || toldUnsupportedRef.current) return;
    if (!session?.id || session.status !== "awaiting_consent") return;
    const me = (session.participants || []).find((p) => p.role === role);
    if (me?.consent !== "pending") return;

    toldUnsupportedRef.current = true;
    axios
      .post(`${API}/sessions/${session.id}/unsupported`)
      .then(({ data }) => setSession(data.session))
      .catch(() => {
        // Не смогли сказать — не беда: писать всё равно не будем, а врач
        // увидит, что согласия нет. Повторять незачем.
      });
  }, [canRecord, session?.id, session?.status, session?.participants, role]);

  /** Обе стороны следят за состоянием сеанса: согласие приходит извне. */
  const poll = useCallback(async (id) => {
    try {
      const { data } = await axios.get(`${API}/sessions/${id}`);
      setSession(data.session);
      return data.session;
    } catch {
      return null;
    }
  }, []);

  /**
   * Поиск сеанса ПО КОМНАТЕ.
   *
   * Без него модуль не работает вовсе: сеанс создаёт врач, и его
   * идентификатор существует только у врача. Пациент знает лишь
   * комнату — и без поиска по ней он никогда не узнал бы, что у него
   * спрашивают согласие, а врач ждал бы ответа, которого не будет.
   *
   * Врачу это тоже нужно: перезагрузил страницу посреди приёма — и без
   * поиска по комнате его собственная запись стала бы недоступна ему
   * самому.
   */
  const lookup = useCallback(async () => {
    if (!room) return null;
    try {
      const { data } = await axios.get(
        `${API}/sessions/by-room/${encodeURIComponent(room)}`,
      );
      if (data.session) setSession(data.session);
      return data.session;
    } catch {
      return null;
    }
  }, [room]);

  // Пока сеанса нет — ищем по комнате; когда есть — следим за ним.
  // Один интервал на оба случая: два таймера на одну задачу однажды
  // разойдутся, и отладить это будет нечем.
  useEffect(() => {
    if (!room) return undefined;
    // Первый запрос сразу: ждать четыре секунды, чтобы показать запрос
    // согласия, — это четыре секунды разговора под запись, на которую
    // человек ещё не согласился.
    if (session?.id) poll(session.id);
    else lookup();

    pollRef.current = setInterval(() => {
      if (session?.id) poll(session.id);
      else lookup();
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [room, session?.id, poll, lookup]);

  // Как только обе стороны согласились — начинаем писать свой микрофон.
  useEffect(() => {
    if (session?.status === "recording" && rec.state === "ready") {
      rec.start(session.id, speechLang);
    }
    if (
      (session?.status === "revoked" || session?.status === "declined") &&
      rec.state === "recording"
    ) {
      rec.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.status, rec.state]);

  async function startRecording() {
    setBusy(true);
    setNotice(null);
    try {
      // Проверяем микрофон ДО создания сеанса: иначе пациент получил бы
      // запрос согласия на запись, которая технически невозможна.
      const ok = await rec.probe();
      if (!ok) return;

      const { data } = await axios.post(`${API}/sessions`, {
        room,
        patientUserId: peerUserId,
        // У телемед-приёма карта и пациент известны заранее — сервер
        // возьмёт их из сеанса, а не будет искать по аккаунту.
        telemedSessionId,
        // Язык приёма кладём В СЕАНС: он должен действовать и на речь
        // пациента, а его браузер о выборе врача не знает.
        lang: speechLang,
      });
      setSession(data.session);
      setNotice(t("scribe.notice.awaitingConsent", "Ждём согласия пациента — до этого не записывается ничего"));
    } catch (err) {
      setNotice(err?.response?.data?.message ?? t("scribe.notice.startFailed", "Не удалось начать запись"));
    } finally {
      setBusy(false);
    }
  }

  async function answerConsent(granted) {
    setBusy(true);
    try {
      if (granted) await rec.probe();
      const { data } = await axios.post(
        `${API}/sessions/${session.id}/consent`,
        { granted },
      );
      setSession(data.session);
    } catch {
      setNotice(t("scribe.notice.answerFailed", "Не удалось отправить ответ"));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    try {
      rec.stop();
      const { data } = await axios.post(`${API}/sessions/${session.id}/revoke`);
      setSession(data.session);
      setNotice(t("scribe.notice.stopped", "Запись прекращена, сказанное вами удалено"));
    } catch {
      setNotice(t("scribe.notice.stopFailed", "Не удалось прекратить запись"));
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setNotice(t("scribe.notice.collecting", "Собираем черновик…"));
    try {
      // stop() теперь ЖДЁТ последнего куска: без этого flush() увидел бы
      // пустую очередь — кусок ещё не создан.
      await rec.stop();
      // Ждём, пока куски ДОЛЕТЯТ, а не фиксированную паузу.
      //
      // Раньше здесь стояли полторы секунды — догадка, а не ожидание.
      // При приёме короче интервала отправки весь разговор лежит в
      // единственном куске, который уходит уже после stop(), и врач
      // получал «речь не распознана» при исправном микрофоне.
      await rec.flush();
      const { data } = await axios.post(`${API}/sessions/${session.id}/finish`);
      setNotice(null);
      // Пациента передаём вместе с черновиком: карту клиники по нему
      // найдёт окно, и врачу не придётся вписывать идентификатор,
      // которого он нигде не видит.
      // patientRef приходит с сервера, когда приём знал карту. Тогда
      // окно не станет искать её по аккаунту — поиск может не найти, а
      // эта карта достоверна.
      onDraft?.({ ...data, patientUserId: peerUserId, patientName: peerName });
    } catch (err) {
      setNotice(err?.response?.data?.message ?? t("scribe.notice.collectFailed", "Не удалось собрать черновик"));
    } finally {
      setBusy(false);
    }
  }

  // ─── Пациент ────────────────────────────────────────────────────

  if (!isDoctor) {
    if (!session || session.status === "declined") return null;

    const mine = session.participants?.find((p) => p.role === "patient");

    // С телефона писать нельзя — и спрашивать согласие не на что: записи не
    // будет. Одна строка вместо карточки согласия, без кнопок и без доступа
    // к микрофону.
    if (!canRecord) {
      return (
        <div className="scribe scribe--done">
          {t(
            "scribe.patient.mobile",
            "Запись приёма с телефона недоступна — она возможна только с компьютера. Разговор не записывается.",
          )}
        </div>
      );
    }

    if (session.status === "awaiting_consent" && mine?.consent === "pending") {
      return (
        <div className="scribe scribe--ask">
          <div className="scribe__text">
            <strong>
              {t("scribe.consent.title", "Врач просит разрешение записать приём.")}
            </strong>
            <p>
              {t(
                "scribe.consent.lead",
                "Запись нужна, чтобы врач не отвлекался на заполнение карты и смотрел на вас, а не в экран. Отказ ни на что не влияет: приём пройдёт как обычно.",
              )}
            </p>
            {/* Обстоятельно и по пунктам: человек решает про запись своего
                голоса, и решает один раз. Каждое утверждение здесь — про то,
                как система устроена на самом деле, а не обещание.
                Выделенная часть и остальное — ОТДЕЛЬНЫЕ ключи: вёрстка внутри
                переводимой строки заставила бы переводчика таскать теги, а
                порядок слов в языках разный. */}
            <ul className="scribe__facts">
              {CONSENT_FACTS.map((f) => (
                <li key={f}>
                  <strong>{t(`scribe.consent.facts.${f}Term`)}</strong>{" "}
                  {t(`scribe.consent.facts.${f}Text`)}
                </li>
              ))}
            </ul>
            {/* Одна строка, отдельно от пунктов согласия и намеренно
                короткая.
                Причина не в качестве звука, а в авторстве: эхоподавление в
                записи выключено, и с колонок голос врача попадёт в дорожку
                пациента — его слова окажутся приписаны пациенту. Это та же
                подмена, от которой защищает раздельное хранение реплик,
                только в другую сторону.
                Про микрофон пациенту не пишем: он пришёл на приём, а не
                настраивать оборудование. Наушники есть почти у всех. */}
            <p className="scribe__tip">
              {t(
                "scribe.consent.tip",
                "Если есть возможность — наденьте наушники: с колонок голос врача попадёт в вашу запись и будет записан как ваши слова.",
              )}
            </p>
          </div>
          <div className="scribe__actions">
            <button type="button" disabled={busy} onClick={() => answerConsent(true)}>
              {t("scribe.consent.allow", "Разрешаю")}
            </button>
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={() => answerConsent(false)}
            >
              {t("scribe.consent.decline", "Не нужно")}
            </button>
          </div>
        </div>
      );
    }

    if (session.status === "recording") {
      return (
        <div className="scribe scribe--live">
          <span className="scribe__dot" aria-hidden="true" />
          <span>{t("scribe.patient.live", "Идёт запись приёма")}</span>
          <button type="button" className="ghost" disabled={busy} onClick={revoke}>
            {t("scribe.patient.stop", "Прекратить")}
          </button>
        </div>
      );
    }

    if (session.status === "revoked") {
      return (
        <div className="scribe scribe--done">
          {t(
            "scribe.patient.revoked",
            "Запись прекращена, сказанное вами удалено",
          )}
        </div>
      );
    }

    return null;
  }

  // ─── Врач ───────────────────────────────────────────────────────

  // С телефона врач приём не запишет: микрофон занят звонком. Кнопку не
  // показываем вовсе — нажатие отобрало бы микрофон у консультации.
  if (!canRecord) {
    return (
      <div className="scribe scribe--done">
        {t(
          "scribe.doctor.mobile",
          "Запись приёма ведётся только с компьютера: на телефоне микрофон занят звонком.",
        )}
      </div>
    );
  }

  if (!session) {
    const named = mics.filter((m) => m.label);

    return (
      <div className="scribe scribe--setup">
        <div className="scribe__row">
          {/* Язык спрашиваем ДО начала записи: поменять его потом нельзя —
              распознавание идёт по ходу приёма, кусок за куском. */}
          <label className="scribe__lang">
            {t("scribe.doctor.langLabel", "Язык приёма:")}
            <select
              value={speechLang}
              disabled={busy}
              onChange={(e) => setSpeechLang(e.target.value)}
            >
              {SPEECH_LANGS.map((l) => (
                <option key={l.code || "auto"} value={l.code}>
                  {l.key ? t(`scribe.${l.key}`, l.label) : l.label}
                </option>
              ))}
            </select>
          </label>

          {/* Микрофон выбираем явно. Без выбора запись идёт через устройство,
              назначенное системой по умолчанию, — и оно запросто окажется
              встроенным, пока звонок идёт через внешний. */}
          {named.length > 0 ? (
            <label className="scribe__lang">
              {t("scribe.doctor.micLabel", "Микрофон:")}
              <select
                value={micId}
                disabled={busy}
                onChange={(e) => {
                  setMicId(e.target.value);
                  rec.selectDevice(e.target.value);
                }}
              >
                <option value="">
                  {t("scribe.doctor.micDefault", "Системный по умолчанию")}
                </option>
                {named.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={async () => {
                // Названия устройств появляются только после разрешения.
                await rec.probe();
                await refreshMics();
              }}
            >
              {t("scribe.doctor.micShow", "Показать микрофоны")}
            </button>
          )}

          <button type="button" disabled={busy} onClick={startRecording}>
            {t("scribe.doctor.start", "Вести запись приёма")}
          </button>
        </div>

        {/* Обстоятельно — один раз, до начала. Врач, узнавший про наушники
            после приёма, приём уже испортил. */}
        <details className="scribe__how">
          <summary>
            {t("scribe.how.summary", "Как получить разборчивую запись")}
          </summary>
          {HOW_ITEMS.map((k) => (
            <p key={k}>
              <strong>{t(`scribe.how.${k}Term`)}</strong>{" "}
              {t(`scribe.how.${k}Text`)}
            </p>
          ))}
          <p>{t("scribe.how.ownMicText")}</p>
        </details>

        {rec.error && <span className="scribe__err">{rec.error}</span>}
        {notice && <span className="scribe__note">{notice}</span>}
      </div>
    );
  }

  if (session.status === "awaiting_consent") {
    // Пациент с телефона писать не может — ответа не будет, и ждать его
    // значит потратить приём впустую. Говорим прямо, а не «ждём согласия».
    const peer = session.participants?.find((p) => p.role === "patient");
    if (peer?.consent === "unsupported") {
      return (
        <div className="scribe scribe--done">
          {t(
            "scribe.doctor.peerMobile",
            "Пациент подключился с телефона — записать приём не получится: там микрофон занят звонком. Карту придётся заполнить как обычно.",
          )}
        </div>
      );
    }

    return (
      <div className="scribe">
        <span className="scribe__note">
          {t(
            "scribe.doctor.waiting",
            "Ждём согласия пациента. До ответа не записывается ничего.",
          )}
        </span>
      </div>
    );
  }

  if (session.status === "declined") {
    return (
      <div className="scribe scribe--done">
        {t(
          "scribe.doctor.declined",
          "Пациент отказался от записи — заполните карту как обычно",
        )}
      </div>
    );
  }

  if (session.status === "revoked") {
    return (
      <div className="scribe scribe--done">
        {t(
          "scribe.doctor.revoked",
          "Пациент прекратил запись. Черновик можно собрать из того, что прозвучало до этого.",
        )}
        <button type="button" disabled={busy} onClick={finish}>
          {t("scribe.doctor.collect", "Собрать черновик")}
        </button>
      </div>
    );
  }

  return (
    <div className="scribe scribe--live">
      <span className="scribe__dot" aria-hidden="true" />
      <span>
        {t("scribe.doctor.live", "Запись идёт")} · {fmt(rec.seconds)}
      </span>
      <button type="button" disabled={busy} onClick={finish}>
        {t("scribe.doctor.finish", "Завершить и собрать черновик")}
      </button>
      {notice && <span className="scribe__note">{notice}</span>}
    </div>
  );
}
