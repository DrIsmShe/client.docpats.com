// client/src/pages/clinic/vitrina/blocks/ContactsBlock.jsx
//
// ВИТРИНА 2.0 (V2) — блок contacts (порт .pcp-contacts на токены).
// Телефон (tel:), email (mailto:), сайт (внешняя ссылка) + адрес. Данные DTO.
// + Форма заявки (лид): callback/message → submitLead(clinic.slug, {...}).
// Нет ни одного контакта/адреса И форма выключена → блок не рендерится. Section.
//
// Контракт: ({ clinic, config }).
// config.showLeadForm !== false — показывать форму (дефолт: да).
// config.leadFormTitle — заголовок формы (иначе фолбэк).

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle, telHref } from "../lib/utils.js";
import { submitLead } from "../../../../api/clinic";

const CSS = `
.vt-contacts { display: flex; flex-wrap: wrap; gap: 12px 26px; }
.vt-contact { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--v-text-muted); text-decoration: none; }
.vt-contact a, a.vt-contact { color: var(--v-primary); text-decoration: none; }
.vt-contact a:hover, a.vt-contact:hover { text-decoration: underline; }

.vt-lead { margin-top: 26px; max-width: 460px; }
.vt-lead-title { font-size: 16px; font-weight: 600; margin: 0 0 12px; }
.vt-lead-tabs { display: inline-flex; gap: 4px; margin-bottom: 12px; background: rgba(0,0,0,.06); border-radius: 10px; padding: 3px; }
.vt-lead-tab { border: 0; background: transparent; padding: 7px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; color: var(--v-text-muted); font-family: inherit; }
.vt-lead-tab.active { background: #fff; color: var(--v-primary); box-shadow: 0 1px 3px rgba(0,0,0,.14); }
.vt-lead-field { display: block; margin-bottom: 10px; }
.vt-lead-field input,
.vt-lead-field textarea { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid rgba(0,0,0,.15); border-radius: 8px; font-size: 14px; font-family: inherit; background: #fff; color: #1a1a18; }
.vt-lead-field input:focus,
.vt-lead-field textarea:focus { outline: none; border-color: var(--v-primary); }
.vt-lead-field textarea { resize: vertical; min-height: 78px; }
.vt-lead-btn { border: 0; border-radius: 8px; padding: 11px 22px; font-size: 14px; font-weight: 600; cursor: pointer; background: var(--v-primary); color: #fff; font-family: inherit; }
.vt-lead-btn[disabled] { opacity: .55; cursor: default; }
.vt-lead-err { color: #c0392b; font-size: 13px; margin: 8px 0 0; }
.vt-lead-ok { font-size: 14px; margin: 0 0 10px; }
.vt-lead-linkbtn { background: none; border: 0; color: var(--v-primary); cursor: pointer; font-size: 13px; padding: 0; text-decoration: underline; font-family: inherit; }
`;

export default function ContactsBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  const contacts = clinic?.contacts || {};
  const address = clinic?.address || {};
  const addressLine = [address.street, address.city, address.country]
    .filter(Boolean)
    .join(", ");

  const slug = clinic?.slug || "";
  const showLead = config.showLeadForm !== false && Boolean(slug);

  const [mode, setMode] = useState("callback"); // callback | message
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errText, setErrText] = useState("");

  const nameOk = name.trim().length >= 2;
  const phoneOk = phone.replace(/\D/g, "").length >= 6;
  const canSubmit = nameOk && phoneOk && status !== "sending";

  const resetForm = () => {
    setName("");
    setPhone("");
    setMessage("");
    setErrText("");
    setStatus("idle");
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setErrText(
        t("publicClinic.leadValidation", {
          defaultValue: "Укажите имя и телефон.",
        }),
      );
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrText("");
    try {
      await submitLead(slug, {
        name: name.trim(),
        phone: phone.trim(),
        message: mode === "message" ? message.trim() : "",
        type: mode,
      });
      setStatus("success");
    } catch (e) {
      setErrText(
        t("publicClinic.leadError", {
          defaultValue: "Не удалось отправить. Попробуйте позже.",
        }),
      );
      setStatus("error");
    }
  };

  const hasContacts =
    addressLine || contacts.phone || contacts.email || contacts.website;

  // Ни контактов, ни формы — блок не нужен.
  if (!hasContacts && !showLead) return null;

  return (
    <Section
      bg={blockBgStyle(config)}
      id="contacts"
      title={t("publicClinic.contactsTitle", { defaultValue: "Контакты" })}
    >
      <style>{CSS}</style>

      {hasContacts && (
        <div className="vt-contacts">
          {addressLine && <span className="vt-contact">📍 {addressLine}</span>}
          {contacts.phone && (
            <span className="vt-contact">
              📞{" "}
              <a href={telHref(contacts.phone)} dir="ltr">
                {contacts.phone}
              </a>
            </span>
          )}
          {contacts.email && (
            <span className="vt-contact">
              ✉️ <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
            </span>
          )}
          {contacts.website && (
            <span className="vt-contact">
              🌐{" "}
              <a
                href={contacts.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contacts.website}
              </a>
            </span>
          )}
        </div>
      )}

      {showLead && (
        <div className="vt-lead">
          <p className="vt-lead-title">
            {config.leadFormTitle ||
              t("publicClinic.leadFormTitle", {
                defaultValue: "Оставьте заявку — мы свяжемся с вами",
              })}
          </p>

          {status === "success" ? (
            <>
              <p className="vt-lead-ok" style={{ color: "var(--v-primary)" }}>
                ✓{" "}
                {t("publicClinic.leadSuccess", {
                  defaultValue: "Заявка отправлена. Мы скоро свяжемся с вами.",
                })}
              </p>
              <button
                type="button"
                className="vt-lead-linkbtn"
                onClick={resetForm}
              >
                {t("publicClinic.leadSuccessMore", {
                  defaultValue: "Оставить ещё заявку",
                })}
              </button>
            </>
          ) : (
            <>
              <div className="vt-lead-tabs" role="tablist">
                <button
                  type="button"
                  className={`vt-lead-tab ${mode === "callback" ? "active" : ""}`}
                  onClick={() => setMode("callback")}
                >
                  {t("publicClinic.leadCallback", {
                    defaultValue: "Перезвоните мне",
                  })}
                </button>
                <button
                  type="button"
                  className={`vt-lead-tab ${mode === "message" ? "active" : ""}`}
                  onClick={() => setMode("message")}
                >
                  {t("publicClinic.leadMessage", {
                    defaultValue: "Написать сообщение",
                  })}
                </button>
              </div>

              <label className="vt-lead-field">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("publicClinic.leadName", {
                    defaultValue: "Ваше имя",
                  })}
                  autoComplete="name"
                />
              </label>

              <label className="vt-lead-field">
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("publicClinic.leadPhone", {
                    defaultValue: "Телефон",
                  })}
                  autoComplete="tel"
                />
              </label>

              {mode === "message" && (
                <label className="vt-lead-field">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("publicClinic.leadMsg", {
                      defaultValue: "Ваше сообщение",
                    })}
                    rows={3}
                  />
                </label>
              )}

              <button
                type="button"
                className="vt-lead-btn"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {status === "sending"
                  ? t("publicClinic.leadSending", {
                      defaultValue: "Отправка…",
                    })
                  : t("publicClinic.leadSubmit", {
                      defaultValue: "Отправить",
                    })}
              </button>

              {status === "error" && errText && (
                <p className="vt-lead-err">{errText}</p>
              )}
            </>
          )}
        </div>
      )}
    </Section>
  );
}
