// client/src/pages/clinic/vitrina/blocks/ContactsBlock.jsx
//
// ВИТРИНА 2.0 (V1) — блок contacts (порт .pcp-contacts на токены).
// Телефон (tel:), email (mailto:), сайт (внешняя ссылка) + адрес. Данные DTO.
// Нет ни одного контакта и адреса → блок не рендерится. Section.
//
// Контракт: ({ clinic, config }).

import React from "react";
import { useTranslation } from "react-i18next";
import Section from "../components/Section.jsx";
import { blockBgStyle } from "../lib/utils.js";
import { telHref } from "../lib/utils.js";

const CSS = `
.vt-contacts { display: flex; flex-wrap: wrap; gap: 12px 26px; }
.vt-contact { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--v-text-muted); text-decoration: none; }
.vt-contact a, a.vt-contact { color: var(--v-primary); text-decoration: none; }
.vt-contact a:hover, a.vt-contact:hover { text-decoration: underline; }
`;

export default function ContactsBlock({ clinic, config = {} }) {
  const { t } = useTranslation();

  const contacts = clinic?.contacts || {};
  const address = clinic?.address || {};
  const addressLine = [address.street, address.city, address.country]
    .filter(Boolean)
    .join(", ");

  const hasAny =
    addressLine || contacts.phone || contacts.email || contacts.website;
  if (!hasAny) return null;

  return (
    <Section
      bg={blockBgStyle(config)}
      id="contacts"
      title={t("publicClinic.contactsTitle", { defaultValue: "Контакты" })}
    >
      <style>{CSS}</style>
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
    </Section>
  );
}
