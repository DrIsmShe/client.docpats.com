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
import useScribeRecorder from "../hooks/useScribeRecorder";
import "./scribePanel.css";

const API = "/api/v1/scribe";

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ScribePanel({
  role, // "doctor" | "patient"
  room,
  peerUserId, // для врача: userId пациента
  onDraft, // врач: получить черновик после завершения
}) {
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
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

  // Пациент узнаёт о запросе согласия не сам по себе, а по событию
  // сокета. Здесь — опрос как запасной путь: событие может не дойти,
  // а спросить согласие обязательно.
  useEffect(() => {
    if (!session?.id) return undefined;
    pollRef.current = setInterval(() => poll(session.id), 4000);
    return () => clearInterval(pollRef.current);
  }, [session?.id, poll]);

  // Как только обе стороны согласились — начинаем писать свой микрофон.
  useEffect(() => {
    if (session?.status === "recording" && rec.state === "ready") {
      rec.start(session.id);
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
      rec.stop();
      // Пауза перед запросом: последний кусок ещё летит на сервер, и
      // без неё концовка приёма — назначения — в черновик не попадёт.
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await axios.post(`${API}/sessions/${session.id}/finish`);
      setNotice(null);
      onDraft?.(data);
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
