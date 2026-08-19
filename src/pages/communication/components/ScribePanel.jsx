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
import axios from "../../../axios";
import useScribeRecorder, { currentLang } from "../hooks/useScribeRecorder";
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
const SPEECH_LANGS = [
  { code: "", label: "Определить автоматически" },
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
  const rec = useScribeRecorder();
  const pollRef = useRef(null);

  const isDoctor = role === "doctor";

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
      setNotice("Ждём согласия пациента — до этого не записывается ничего");
    } catch (err) {
      setNotice(err?.response?.data?.message ?? "Не удалось начать запись");
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
      setNotice("Не удалось отправить ответ");
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
      setNotice("Запись прекращена, сказанное вами удалено");
    } catch {
      setNotice("Не удалось прекратить запись");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setNotice("Собираем черновик…");
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
      setNotice(err?.response?.data?.message ?? "Не удалось собрать черновик");
    } finally {
      setBusy(false);
    }
  }

  // ─── Пациент ────────────────────────────────────────────────────

  if (!isDoctor) {
    if (!session || session.status === "declined") return null;

    const mine = session.participants?.find((p) => p.role === "patient");

    if (session.status === "awaiting_consent" && mine?.consent === "pending") {
      return (
        <div className="scribe scribe--ask">
          <div className="scribe__text">
            <strong>Врач просит разрешение записать приём.</strong>
            <p>
              Запись нужна, чтобы врач не отвлекался на заполнение карты и
              смотрел на вас, а не в экран. Аудио не сохраняется — из него
              делается черновик записи, который врач проверит и подпишет.
              Отказ ни на что не влияет: приём пройдёт как обычно.
            </p>
          </div>
          <div className="scribe__actions">
            <button type="button" disabled={busy} onClick={() => answerConsent(true)}>
              Разрешаю
            </button>
            <button
              type="button"
              className="ghost"
              disabled={busy}
              onClick={() => answerConsent(false)}
            >
              Не нужно
            </button>
          </div>
        </div>
      );
    }

    if (session.status === "recording") {
      return (
        <div className="scribe scribe--live">
          <span className="scribe__dot" aria-hidden="true" />
          <span>Идёт запись приёма</span>
          <button type="button" className="ghost" disabled={busy} onClick={revoke}>
            Прекратить
          </button>
        </div>
      );
    }

    if (session.status === "revoked") {
      return (
        <div className="scribe scribe--done">
          Запись прекращена, сказанное вами удалено
        </div>
      );
    }

    return null;
  }

  // ─── Врач ───────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="scribe">
        {/* Язык спрашиваем ДО начала записи: поменять его потом нельзя —
            распознавание идёт по ходу приёма, кусок за куском. */}
        <label className="scribe__lang">
          Язык приёма:
          <select
            value={speechLang}
            disabled={busy}
            onChange={(e) => setSpeechLang(e.target.value)}
          >
            {SPEECH_LANGS.map((l) => (
              <option key={l.code || "auto"} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={busy} onClick={startRecording}>
          Вести запись приёма
        </button>
        {rec.error && <span className="scribe__err">{rec.error}</span>}
        {notice && <span className="scribe__note">{notice}</span>}
      </div>
    );
  }

  if (session.status === "awaiting_consent") {
    return (
      <div className="scribe">
        <span className="scribe__note">
          Ждём согласия пациента. До ответа не записывается ничего.
        </span>
      </div>
    );
  }

  if (session.status === "declined") {
    return (
      <div className="scribe scribe--done">
        Пациент отказался от записи — заполните карту как обычно
      </div>
    );
  }

  if (session.status === "revoked") {
    return (
      <div className="scribe scribe--done">
        Пациент прекратил запись. Черновик можно собрать из того, что
        прозвучало до этого.
        <button type="button" disabled={busy} onClick={finish}>
          Собрать черновик
        </button>
      </div>
    );
  }

  return (
    <div className="scribe scribe--live">
      <span className="scribe__dot" aria-hidden="true" />
      <span>Запись идёт · {fmt(rec.seconds)}</span>
      <button type="button" disabled={busy} onClick={finish}>
        Завершить и собрать черновик
      </button>
      {notice && <span className="scribe__note">{notice}</span>}
    </div>
  );
}
