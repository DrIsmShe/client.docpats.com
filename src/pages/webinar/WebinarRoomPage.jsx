// client/src/pages/webinar/WebinarRoomPage.jsx
//
// Страница входа во встречу: /webinar/:id — тот адрес, который ведущий
// рассылает участникам.
//
// Карточка встречи приходит и тем, кого не пустят: человек, открывший
// ссылку, должен увидеть название и понятное «вас сюда не звали», а не
// пустой экран или голый отказ.
//
// Гостей без аккаунта здесь нет. Пускать в медицинскую встречу по одной
// ссылке без опознания — отдельное решение с подписанными ссылками и
// сроком жизни, как у /previsit и /pay; тихо разрешать такое нельзя.

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import JitsiRoom from "../communication/components/JitsiRoom";
import { useCurrentUser } from "../communication/hooks/useCurrentUserId";
import { errorText, getWebinar } from "../../api/webinar";
import styles from "./WebinarsPage.module.css";

const STATUS_NOTE = {
  scheduled: "Встреча ещё не начиналась — вы войдёте первым.",
  live: "Встреча идёт.",
  ended: "Встреча завершена.",
};

export default function WebinarRoomPage() {
  const { id } = useParams();
  const { name } = useCurrentUser();

  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getWebinar(id)
      .then((data) => !cancelled && setWebinar(data))
      .catch((err) => !cancelled && setError(errorText(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Загружаем встречу…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.alertError}>{error}</div>
      </div>
    );
  }

  const canEnter = webinar?.mayJoin && webinar.status !== "ended";

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>
          Встреча{webinar.isModerator ? " · вы ведущий" : ""}
        </span>
        <h1 className={styles.title}>{webinar.title}</h1>
        {webinar.description ? (
          <p className={styles.lead}>{webinar.description}</p>
        ) : null}
        <p className={styles.muted}>
          {STATUS_NOTE[webinar.status] || ""}
          {webinar.lobbyEnabled && !webinar.isModerator
            ? " Вход через комнату ожидания — ведущий впустит вас."
            : ""}
        </p>
      </header>

      {!canEnter ? (
        <div className={styles.alertError}>
          {webinar.status === "ended"
            ? "Встреча завершена, войти уже нельзя."
            : "Вас не приглашали на эту встречу. Попросите ведущего добавить вас."}
        </div>
      ) : (
        <section className={styles.panel}>
          {/* Комната та же, что у консилиумов и приёмов: своя обвязка
              вокруг Jitsi здесь была бы третьей копией одного и того же. */}
          <JitsiRoom source="webinar" id={id} displayName={name || ""} />
        </section>
      )}
    </div>
  );
}
