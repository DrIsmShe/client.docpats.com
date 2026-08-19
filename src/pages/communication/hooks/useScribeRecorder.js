// client/src/pages/communication/hooks/useScribeRecorder.js
//
// Запись СВОЕГО микрофона во время приёма и отправка кусков на сервер.
//
// ─── ПОЧЕМУ КАЖДЫЙ ПИШЕТ СЕБЯ ────────────────────────────────────────
//
// Видео идёт через iframe-API Jitsi, и чужие аудиодорожки из него
// недоступны — это граница источников, а не недоработка. Серверная
// запись потребовала бы правки развёртывания Jitsi.
//
// Поэтому врач пишет врача, пациент — пациента. Побочные выигрыши важнее
// самого обхода: разделение говорящих получается точным (поток врача
// пришёл от врача — ошибиться нечем), согласие становится техническим
// (не согласился — браузер не пишет), а качество выше, чем у общей
// дорожки, прошедшей через два кодека и эхоподавление.
//
// ─── ВТОРОЙ ПОТОК МИКРОФОНА ──────────────────────────────────────────
//
// Микрофон уже занят звонком. Браузеры позволяют открыть второй поток с
// того же устройства, но не все и не всегда. Поэтому доступность
// проверяется ЯВНО до начала записи, и при отказе врач видит honest
// «записать не получится», а не тишину и пустой черновик в конце приёма.
//
// Эхоподавление и шумодав на нашем потоке ВЫКЛЮЧЕНЫ: они настроены под
// разговор, а не под распознавание, и срезают тихую речь — как раз ту,
// которую труднее всего разобрать потом по памяти.

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "../../../axios";
import i18n from "../../../i18n";

const API = "/api/v1/scribe";

/** Язык интерфейса — им подставляется переключатель языка приёма. */
export function currentLang() {
  return String(i18n?.language ?? "")
    .slice(0, 2)
    .toLowerCase();
}

// Двадцать секунд: короче — счёт запросов к распознаванию растёт быстрее
// пользы, длиннее — врач дольше ждёт черновик после «Завершить».
const CHUNK_MS = 20000;

// Формат выбирается по тому, что умеет браузер. Порядок не случайный:
// opus в webm понимает и распознавание, и все настольные браузеры;
// mp4 — запасной для Safari.
const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  return MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) || null;
}

export function useScribeRecorder() {
  const [state, setState] = useState("idle"); // idle | ready | recording | error
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  // Отправки, которые ещё в пути. Нужны, чтобы «Завершить» дождался их,
  // а не гадал по таймеру: при коротком приёме ВЕСЬ разговор лежит в
  // последнем куске, и уйти он не успевает.
  const inFlightRef = useRef(new Set());
  const sessionIdRef = useRef(null);
  const startedAtRef = useRef(0);
  const tickRef = useRef(null);
  // Язык приёма, выбранный врачом до начала записи.
  const langRef = useRef("");

  /** Можно ли вообще писать в этом браузере и на этом устройстве. */
  const probe = useCallback(async () => {
    if (!pickMime()) {
      setError("Браузер не умеет записывать звук. Откройте приём в Chrome.");
      setState("error");
      return false;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Выключены намеренно — см. шапку файла.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      // Поток сразу отпускаем: это была проверка, а не начало записи.
      s.getTracks().forEach((t) => t.stop());
      setState("ready");
      setError(null);
      return true;
    } catch {
      setError(
        "Не удалось открыть микрофон для записи — он занят звонком. " +
          "Запись приёма недоступна, карту придётся заполнить вручную.",
      );
      setState("error");
      return false;
    }
  }, []);

  const sendChunk = useCallback(async (blob) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || !blob?.size) return;

    const form = new FormData();
    form.append("audio", blob, "chunk.webm");
    // Язык приёма — его выбирает врач ПЕРЕД записью, и он зафиксирован на
    // всю запись (langRef), а не читается из интерфейса на каждый кусок:
    // переключив язык страницы посреди приёма, врач разорвал бы расшифровку
    // на две разноязычные половины.
    //
    // Раньше язык не передавался вовсе, и распознаватель получал русскую
    // подсказку-глоссарий на любую речь: азербайджанский приём возвращался
    // то списком препаратов из подсказки, то русской транслитерацией
    // азербайджанских слов.
    form.append("lang", langRef.current || currentLang());
    form.append(
      "startSec",
      String(Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000) - CHUNK_MS / 1000)),
    );

    // Запрос кладём в набор незавершённых: на нём ждёт flush().
    // Распознавание идёт СИНХРОННО внутри этого запроса, поэтому его
    // успешное завершение означает, что реплика уже в базе — ждать
    // чего-то ещё после него не нужно.
    const p = axios
      .post(`${API}/sessions/${sessionId}/chunks`, form)
      .catch(() => {
        // Потерянный кусок не должен останавливать приём: в черновике
        // будет пробел, и врач увидит его в списке «не прозвучало».
        // Ронять запись целиком из-за одной неудачной отправки хуже.
      })
      .finally(() => {
        inFlightRef.current.delete(p);
      });

    inFlightRef.current.add(p);
    return p;
  }, []);

  /**
   * Дождаться, пока все куски долетят.
   *
   * Заменяет прежнюю паузу в полторы секунды — она была догадкой, а не
   * ожиданием. При коротком приёме (короче интервала в 20 секунд) весь
   * разговор лежит в ЕДИНСТВЕННОМ куске, который отправляется уже после
   * stop(); полторы секунды на отправку и распознавание не хватало, и
   * врач получал «речь не распознана» при исправно работавшем микрофоне.
   *
   * Потолок всё же есть: сеть может висеть минутами, а врач ждёт
   * черновик. Лучше собрать его без последнего куска, чем не собрать.
   */
  const flush = useCallback(async (timeoutMs = 30000) => {
    const pending = Array.from(inFlightRef.current);
    if (!pending.length) return;
    await Promise.race([
      Promise.allSettled(pending),
      new Promise((r) => setTimeout(r, timeoutMs)),
    ]);
  }, []);

  const start = useCallback(
    async (sessionId, lang = "") => {
      sessionIdRef.current = sessionId;
      langRef.current = String(lang || "")
        .slice(0, 2)
        .toLowerCase();
      const mime = pickMime();
      if (!mime) return false;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const rec = new MediaRecorder(stream, { mimeType: mime });
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) sendChunk(e.data);
        };
        // timeslice — куски приходят сами, без остановки записи.
        rec.start(CHUNK_MS);
        recorderRef.current = rec;

        startedAtRef.current = Date.now();
        setSeconds(0);
        tickRef.current = setInterval(
          () => setSeconds(Math.round((Date.now() - startedAtRef.current) / 1000)),
          1000,
        );

        setState("recording");
        return true;
      } catch {
        setError("Не удалось начать запись: микрофон недоступен");
        setState("error");
        return false;
      }
    },
    [sendChunk],
  );

  /**
   * Остановить запись и ДОЖДАТЬСЯ последнего куска.
   *
   * Возвращает промис не для красоты: ondataavailable после stop()
   * срабатывает АСИНХРОННО, и без ожидания onstop вызывающий код
   * побежит дальше, когда последнего куска ещё не существует — flush()
   * найдёт пустой список и вернётся мгновенно. Ровно так и терялся
   * короткий приём: весь разговор лежал в этом куске.
   */
  const stop = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    const rec = recorderRef.current;
    recorderRef.current = null;

    const releaseStream = () => {
      const stream = streamRef.current;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setState("ready");
    };

    if (!rec || rec.state === "inactive") {
      releaseStream();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      // Страховка от браузера, который onstop не пришлёт: приём не
      // должен зависнуть на кнопке «Завершить».
      const guard = setTimeout(() => {
        releaseStream();
        resolve();
      }, 5000);

      rec.onstop = () => {
        clearTimeout(guard);
        releaseStream();
        resolve();
      };

      // requestData перед stop — иначе последний неполный кусок
      // теряется, а это концовка приёма: назначения и рекомендации.
      try {
        rec.requestData();
      } catch {
        /* некоторые браузеры не поддерживают — тогда его отдаст stop */
      }
      try {
        rec.stop();
      } catch {
        clearTimeout(guard);
        releaseStream();
        resolve();
      }
    });
  }, []);

  // Уход со страницы посреди приёма не должен оставлять микрофон
  // включённым: индикатор записи в браузере горел бы и после звонка.
  useEffect(() => () => stop(), [stop]);

  return { state, error, seconds, probe, start, stop, flush };
}

export default useScribeRecorder;
