// client/src/pages/clinic/ClinicRequisitesPage/ClinicRequisitesPage.jsx
//
// Реквизиты учреждения: то, что печатается в шапке рецепта и других
// официальных бланков.
//
// Появилась потому, что вводить эти данные было негде вовсе: сервер их
// принимал, модель хранила, бланк печатал — а формы не существовало. В
// результате рецепт выходил с пустой графой «Лицензия учреждения» и без
// адреса под названием клиники, то есть юридически неполным.
//
// Форма намеренно скучная: это документ, а не витрина. Никаких подсказок
// «заполните позже» — незаполненное поле на бланке видно сразу.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getClinicMe, updateClinic } from "../../../api/clinic";
import PageNav from "../../../components/shared/PageNav";
import "../clinicPageShell.css";
import "./clinicRequisitesPage.css";

export default function ClinicRequisitesPage() {
  const { t } = useTranslation("clinic");

  const [clinic, setClinic] = useState(null);
  const [state, setState] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    legalName: "",
    taxId: "",
    licenseNumber: "",
    street: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
  });

  useEffect(() => {
    let alive = true;
    getClinicMe()
      .then((res) => {
        if (!alive) return;
        const c = res?.clinic || res?.data?.clinic || res || null;
        if (!c?._id) {
          setState("error");
          return;
        }
        setClinic(c);
        setForm({
          legalName: c.legalName || "",
          taxId: c.taxId || "",
          licenseNumber: c.licenseNumber || "",
          street: c.address?.street || "",
          city: c.address?.city || "",
          country: c.address?.country || "",
          phone: c.contacts?.phone || "",
          email: c.contacts?.email || "",
          website: c.contacts?.website || "",
        });
        setState("ready");
      })
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      // Пустые строки не отправляем: сервер валидирует адрес почты и сайта,
      // и пустая строка провалила бы проверку целиком — вместе с полями,
      // которые врач как раз заполнил.
      const updates = {};
      const put = (k, v) => {
        if (String(v || "").trim()) updates[k] = String(v).trim();
      };
      put("legalName", form.legalName);
      put("taxId", form.taxId);
      put("licenseNumber", form.licenseNumber);

      const address = {};
      if (form.street.trim()) address.street = form.street.trim();
      if (form.city.trim()) address.city = form.city.trim();
      // Страна на сервере — двухбуквенный код (AZ, TR): так её ждёт схема.
      if (form.country.trim()) address.country = form.country.trim().toUpperCase();
      if (Object.keys(address).length) updates.address = address;

      const contacts = {};
      if (form.phone.trim()) contacts.phone = form.phone.trim();
      if (form.email.trim()) contacts.email = form.email.trim();
      if (form.website.trim()) contacts.website = form.website.trim();
      if (Object.keys(contacts).length) updates.contacts = contacts;

      await updateClinic(clinic._id, updates);
      setSaved(true);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          t("requisites.saveFailed", { defaultValue: "Не удалось сохранить" }),
      );
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="staff-page">
        <div className="staff-page-loading">
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="staff-page">
        <PageNav fallback="/clinic" />
        <div className="staff-page-empty">
          {t("requisites.loadFailed", {
            defaultValue: "Не удалось загрузить данные клиники",
          })}
        </div>
      </div>
    );
  }

  const field = (key, label, extra = {}) => (
    <label className="req-field">
      <span className="req-label">{label}</span>
      <input
        value={form[key]}
        onChange={set(key)}
        disabled={saving}
        {...extra}
      />
    </label>
  );

  return (
    <div className="staff-page">
      <PageNav fallback="/clinic" />

      <div className="staff-page-header">
        <h1>
          {t("requisites.title", { defaultValue: "Реквизиты клиники" })}
        </h1>
        <p className="req-hint">
          {t("requisites.hint", {
            defaultValue:
              "Эти данные печатаются в шапке рецептов и других бланков. Незаполненные поля остаются на бланке пустыми.",
          })}
        </p>
      </div>

      <div className="req-card">
        <h2 className="req-section">
          {t("requisites.legal", { defaultValue: "Юридические данные" })}
        </h2>
        {field(
          "legalName",
          t("requisites.legalName", { defaultValue: "Юридическое название" }),
        )}
        {field("taxId", t("requisites.taxId", { defaultValue: "ВОЕН / ИНН" }))}
        {field(
          "licenseNumber",
          t("requisites.licenseNumber", {
            defaultValue: "Номер лицензии учреждения",
          }),
        )}

        <h2 className="req-section">
          {t("requisites.address", { defaultValue: "Адрес" })}
        </h2>
        {field("street", t("requisites.street", { defaultValue: "Улица, дом" }))}
        <div className="req-row">
          {field("city", t("requisites.city", { defaultValue: "Город" }))}
          {field(
            "country",
            t("requisites.country", { defaultValue: "Страна (код: AZ, TR)" }),
            { maxLength: 2 },
          )}
        </div>

        <h2 className="req-section">
          {t("requisites.contacts", { defaultValue: "Контакты" })}
        </h2>
        {field("phone", t("requisites.phone", { defaultValue: "Телефон" }))}
        {field("email", t("requisites.email", { defaultValue: "Электронная почта" }), {
          type: "email",
        })}
        {field(
          "website",
          t("requisites.website", { defaultValue: "Сайт (https://…)" }),
        )}

        {error && <div className="req-error">{error}</div>}

        <div className="req-actions">
          <button
            type="button"
            className="staff-page-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving
              ? t("common.submitting", { defaultValue: "Сохранение…" })
              : t("common.save", { defaultValue: "Сохранить" })}
          </button>
          {saved && (
            <span className="req-saved">
              {t("requisites.saved", { defaultValue: "Сохранено" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
