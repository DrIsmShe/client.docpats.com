// client/src/pages/newsletter/NewsletterConfirmPage.jsx
//
// Страница, на которую ведёт ссылка из письма-подтверждения.
//
// Существует потому, что подписка без подтверждения адреса недопустима:
// адрес вводит кто угодно и какой угодно, в том числе чужой. Пока человек
// не открыл ссылку, писем ему не уходит.

import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../components/newsletter/newsletterModal.css";

const API = process.env.REACT_APP_API_URL;

export default function NewsletterConfirmPage() {
  const { t } = useTranslation("common");
  const [params] = useSearchParams();
  const [state, setState] = useState("checking");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("bad");
      return;
    }
    fetch(
      `${API}/api/v1/public/newsletter/confirm?token=${encodeURIComponent(token)}`,
    )
      .then((r) => r.json())
      .then((d) => setState(d?.ok ? "ok" : d?.reason === "expired" ? "expired" : "bad"))
      .catch(() => setState("bad"));
  }, [params]);

  const body = {
    checking: {
      title: t("newsletter.confirmChecking", { defaultValue: "Проверяем ссылку…" }),
      text: "",
    },
    ok: {
      title: t("newsletter.confirmOk", { defaultValue: "Подписка подтверждена" }),
      text: t("newsletter.confirmOkText", {
        defaultValue:
          "Первое письмо придёт в ближайшую рассылку. Отписаться можно одной ссылкой в любом письме.",
      }),
    },
    expired: {
      title: t("newsletter.confirmExpired", {
        defaultValue: "Ссылка устарела",
      }),
      text: t("newsletter.confirmExpiredText", {
        defaultValue:
          "Ссылка действует неделю. Подпишитесь ещё раз — мы пришлём новую.",
      }),
    },
    bad: {
      title: t("newsletter.confirmBad", { defaultValue: "Ссылка не подошла" }),
      text: t("newsletter.confirmBadText", {
        defaultValue:
          "Возможно, подписка уже подтверждена или ссылку открыли повторно — она одноразовая.",
      }),
    },
  }[state];

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div className="nl-card" style={{ animation: "none", textAlign: "center" }}>
        {state === "ok" && (
          <div className="nl-done-mark" aria-hidden="true">
            ✓
          </div>
        )}
        <div className="nl-brand">DocPats</div>
        <h1 className="nl-title">{body.title}</h1>
        {body.text && <p className="nl-text">{body.text}</p>}
        <Link to="/" className="nl-submit" style={{ display: "inline-block", textDecoration: "none", width: "auto", padding: "13px 30px" }}>
          {t("newsletter.toSite", { defaultValue: "На главную" })}
        </Link>
      </div>
    </div>
  );
}
