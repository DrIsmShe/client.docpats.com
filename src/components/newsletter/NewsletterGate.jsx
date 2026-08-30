// client/src/components/newsletter/NewsletterGate.jsx
//
// Решает, когда и кому показать предложение подписки.
//
// Вся ценность здесь в том, чего окно НЕ делает. Оно не выпрыгивает на
// первой секунде, не встречает человека раньше содержимого сайта, не
// возвращается на следующий день после отказа и не появляется у тех, у
// кого подписка уже есть. Предложение, показанное не вовремя, закрывают
// не читая — и второй попытки уже не будет.
//
// Условия показа, все обязательны:
//   1. гость — у врача и пациента подписка живёт в настройках уведомлений;
//   2. открытая часть сайта, а не кабинет: в рабочей зоне человек занят
//      делом, и любое окно поверх — помеха;
//   3. человек успел почитать: полминуты на странице или прокрутка до
//      середины. Раньше предлагать нечего — он ещё не понял, куда попал;
//   4. раньше не отказывался (месяц) и не подписывался (никогда).

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NewsletterModal from "./NewsletterModal";
import { getSession } from "../../api/session";

const KEY = "dp_newsletter_state";
const DISMISS_DAYS = 30;
const READ_MS = 30000;

// Зоны кабинетов. В них не показываем: человек работает.
const PRIVATE_PREFIXES = [
  "/clinic",
  "/doctor",
  "/patient",
  "/admin",
  "/dp",
  "/login",
  "/register",
];

function readState() {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "{}");
  } catch {
    // Приватный режим или запрет хранилища. Тогда молчим: показывать
    // окно, не умея запомнить отказ, значит показывать его каждый раз.
    return null;
  }
}

function writeState(patch) {
  try {
    const cur = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    window.localStorage.setItem(KEY, JSON.stringify({ ...cur, ...patch }));
  } catch {
    /* не критично */
  }
}

export default function NewsletterGate() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return undefined;

    const state = readState();
    if (!state) return undefined;
    if (state.subscribed) return undefined;
    if (
      state.dismissedAt &&
      Date.now() - state.dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000
    ) {
      return undefined;
    }

    const inPrivateZone = PRIVATE_PREFIXES.some((p) =>
      location.pathname.startsWith(p),
    );
    if (inPrivateZone) return undefined;

    let alive = true;
    let timer = null;

    const arm = () => {
      const fire = () => {
        if (!alive) return;
        cleanup();
        setShow(true);
      };

      const onScroll = () => {
        const doc = document.documentElement;
        const seen = window.scrollY + window.innerHeight;
        // Половина страницы — признак, что читают, а не проскочили мимо.
        if (seen >= doc.scrollHeight * 0.5) fire();
      };

      timer = window.setTimeout(fire, READ_MS);
      window.addEventListener("scroll", onScroll, { passive: true });

      cleanupFns.push(() => {
        window.clearTimeout(timer);
        window.removeEventListener("scroll", onScroll);
      });
    };

    const cleanupFns = [];
    const cleanup = () => cleanupFns.forEach((fn) => fn());

    // Гость или нет — узнаём у сервера. Ошибку считаем «не гость»: лучше
    // не показать, чем показать тому, у кого подписка уже есть.
    getSession()
      .then((d) => {
        if (!alive || d?.authenticated) return;
        arm();
      })
      .catch(() => {});

    return () => {
      alive = false;
      cleanup();
    };
  }, [location.pathname, show]);

  if (!show) return null;

  return (
    <NewsletterModal
      locale={i18n.language || "ru"}
      onClose={(reason) => {
        setShow(false);
        writeState(
          reason === "subscribed"
            ? { subscribed: true }
            : { dismissedAt: Date.now() },
        );
      }}
    />
  );
}
