// client/src/pages/clinic/vitrina/lib/useViewer.js
//
// Кто смотрит страницу витрины: гость или вошедший пользователь DocPats.
//
// Витрина публичная, и большинство её страниц про посетителя ничего знать не
// должны. Но лайки, комментарии и отзывы — те же, что на платформе: читать их
// может любой, оставлять — только вошедший. Чтобы показать форму или
// приглашение войти, страница обязана различать эти два случая.
//
// Гостю бэкенд отвечает ошибкой — это НЕ сбой, а нормальный ответ. Поэтому
// ошибка гасится и превращается в isAuthenticated: false, а не всплывает
// наружу: посетитель без аккаунта не должен видеть ничего сломанного.

import { useEffect, useState } from "react";
import api from "../../../../axios";

export function useViewer() {
  const [state, setState] = useState({
    userId: null,
    isAuthenticated: false,
    // ready различает «ещё не спросили» и «спросили, это гость». Без него
    // блок комментариев моргал бы приглашением войти у вошедшего.
    ready: false,
  });

  useEffect(() => {
    let alive = true;

    api
      .get("/common-for-user")
      .then((res) => {
        if (!alive) return;
        const userId = res?.data?.user?.userId || null;
        setState({ userId, isAuthenticated: Boolean(userId), ready: true });
      })
      .catch(() => {
        if (!alive) return;
        setState({ userId: null, isAuthenticated: false, ready: true });
      });

    return () => {
      alive = false;
    };
  }, []);

  return state;
}

export default useViewer;
