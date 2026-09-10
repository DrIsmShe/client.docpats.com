// client/src/pages/videra/StudioImportRedirect.jsx
//
// Перевалочный адрес для переноса фильма из студии: /videos/import?key=…
//
// ЗАЧЕМ ОН НУЖЕН. Студия живёт на другом сервере и о том, кто нажал
// кнопку, знает только со слов пропуска DocPats. Пропуск живёт пять минут,
// но выданный до появления в нём роли — уже у человека в браузере, и
// студия по нему уводила всех в /doctor/videos: пациент попадал в чужую
// зону, страж отвечал 403, и человека выбрасывало на страницу входа.
//
// Гадать на стороне студии не нужно вовсе. Кабинет знает роль точно —
// из сессии. Поэтому студия ведёт СЮДА, а разводит по кабинетам уже
// платформа. Работает при любом возрасте пропуска и переживёт следующую
// правку в студии.
//
// Ключ фильма прокидываем как есть: он одноразовый и нужен той странице,
// которая будет забирать файл.

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function StudioImportRedirect() {
  const [параметры] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let живо = true;

    const развести = async () => {
      // Ключ приходит и под именем key (со студии), и под именем import
      // (если человек попал сюда по старой ссылке из письма).
      const ключ = параметры.get("key") || параметры.get("import") || "";

      let зона = "patient";
      try {
        const о = await axios.get(
          `${process.env.REACT_APP_API_URL}/common-for-user`,
          { withCredentials: true },
        );
        if (!о.data?.authenticated) {
          // Не вошёл — на вход, но с возвратом сюда же: после входа
          // перенос продолжится, а не потеряется.
          navigate(
            `/login?redirect=${encodeURIComponent(
              `/videos/import?key=${ключ}`,
            )}`,
            { replace: true },
          );
          return;
        }
        зона = о.data.user?.role === "doctor" ? "doctor" : "patient";
      } catch {
        /* сеть подвела — ведём в пациентскую зону: она открыта обеим
           ролям, а врачебная пациенту закрыта. */
      }

      if (!живо) return;
      navigate(
        ключ ? `/${зона}/videos?import=${encodeURIComponent(ключ)}` : `/${зона}/videos`,
        { replace: true },
      );
    };

    развести();
    return () => {
      живо = false;
    };
  }, [navigate, параметры]);

  return (
    <div style={{ padding: "48px 16px", textAlign: "center", color: "#64748b" }}>
      {t("videra.import.redirecting", {
        defaultValue: "Открываем вашу библиотеку роликов…",
      })}
    </div>
  );
}
