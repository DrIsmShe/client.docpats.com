// client/src/pages/clinic/ServicesPage/ServicesPage.jsx
//
// ВИТРИНА 2.0 (V4.2) — управление услугами клиники (прайс-лист).
// CRUD услуг: создать / редактировать / архивировать. Привязка к отделению
// (departmentId) опциональна. Список группируется по отделениям + «Без отдела».
//
// Паттерн зеркалит ClinicCustomPagesPage: useTranslation("clinic"),
// права через getClinicMe (clinic.write | owner | admin), teal CSS, inline-форма.
// API из ../../../api/clinic. Отделения тянем listDepartments для селекта.

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getClinicMe,
  listServices,
  createService,
  updateService,
  archiveService,
  listDepartments,
} from "../../../api/clinic";
import { useNavigate } from "react-router-dom";
const CSS = `
.svp { max-width: 1080px; margin: 0 auto; padding: 24px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
.svp-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.svp-title { font-size: 22px; font-weight: 700; color: #292524; margin: 0; }
.svp-btn { border: none; border-radius: 8px; padding: 8px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.svp-btn-primary { background: #0f766e; color: #fff; }
.svp-btn-primary:disabled { opacity: .5; cursor: default; }
.svp-btn-ghost { background: #f5f3ef; color: #44403c; }
.svp-error { background: #fdecea; color: #c0392b; border: 1px solid #f5c6cb; border-radius: 8px; padding: 10px 14px; font-size: 14px; margin-bottom: 14px; }
.svp-empty { padding: 32px; text-align: center; color: #a8a29e; font-size: 14px; border: 1px dashed #d6d0c4; border-radius: 10px; }

.svp-group { margin-bottom: 22px; }
.svp-group-title { font-size: 14px; font-weight: 700; color: #57534e; text-transform: uppercase; letter-spacing: .04em; margin: 0 0 8px; }
.svp-list { display: flex; flex-direction: column; gap: 8px; }
.svp-item { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e7e2d8; border-radius: 10px; padding: 12px 16px; flex-wrap: wrap; }
.svp-item.archived { opacity: .55; }
.svp-item-name { flex: 1; font-size: 15px; font-weight: 600; color: #292524; min-width: 160px; }
.svp-item-desc { flex-basis: 100%; font-size: 13px; color: #78716c; margin-top: -4px; }
.svp-item-price { font-size: 14px; font-weight: 700; color: #0f766e; white-space: nowrap; }
.svp-item-dur { font-size: 12px; color: #a8a29e; }
.svp-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; }
.svp-badge.archived { background: #f3f4f6; color: #6b7280; }
.svp-act { border: none; background: transparent; cursor: pointer; font-size: 13px; color: #0f766e; font-weight: 600; padding: 4px 8px; border-radius: 6px; }
.svp-act:hover { background: #f5f3ef; }
.svp-act.danger { color: #c0392b; }

.svp-form { background: #faf9f6; border: 1px solid #e7e2d8; border-radius: 12px; padding: 18px; margin-bottom: 22px; }
.svp-form-title { font-size: 16px; font-weight: 700; color: #292524; margin: 0 0 14px; }
.svp-row { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.svp-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px; }
.svp-field.full { flex-basis: 100%; }
.svp-label { font-size: 12px; font-weight: 600; color: #57534e; }
.svp-input, .svp-select, .svp-textarea { border: 1px solid #d6d0c4; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-family: inherit; background: #fff; }
.svp-textarea { resize: vertical; min-height: 56px; }
.svp-form-actions { display: flex; gap: 8px; margin-top: 4px; }
`;

const PRICE_TYPES = ["fixed", "from", "range", "on_request", "free"];

const emptyForm = {
  name: "",
  description: "",
  departmentId: "",
  priceType: "fixed",
  price: "",
  priceMax: "",
  currency: "",
  durationMinutes: "",
  order: "",
};

export default function ServicesPage() {
  const { t } = useTranslation("clinic");
  const navigate = useNavigate();
  const [canWrite, setCanWrite] = useState(false);
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = создание
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadServices = useCallback(async () => {
    const list = await listServices(); // без фильтра → active + archived
    setServices(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getClinicMe(), listServices(), listDepartments()])
      .then(([me, svc, deps]) => {
        if (!alive) return;
        setCanWrite(
          Boolean(me?.permissions?.includes?.("clinic.write")) ||
            me?.role === "owner" ||
            me?.role === "admin",
        );
        setServices(Array.isArray(svc) ? svc : []);
        // listDepartments() возвращает { items: [...] } (normalizeList)
        setDepartments(Array.isArray(deps?.items) ? deps.items : []);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(t("services.loadError", { defaultValue: "Ошибка загрузки." }));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [t]);

  const deptNameById = new Map(
    departments.map((d) => [String(d._id || d.id), d.name]),
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  };

  const openEdit = (s) => {
    setEditingId(s._id || s.id);
    setForm({
      name: s.name || "",
      description: s.description || "",
      departmentId: s.departmentId ? String(s.departmentId) : "",
      priceType: s.priceType || "fixed",
      price: typeof s.price === "number" ? String(s.price) : "",
      priceMax: typeof s.priceMax === "number" ? String(s.priceMax) : "",
      currency: s.currency || "",
      durationMinutes:
        typeof s.durationMinutes === "number" ? String(s.durationMinutes) : "",
      order: typeof s.order === "number" ? String(s.order) : "",
    });
    setShowForm(true);
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Собрать payload: строки → числа/null. Пустые числовые → null.
  const buildPayload = () => {
    const num = (v) => {
      const s = String(v).trim();
      if (s === "") return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      departmentId: form.departmentId || null,
      priceType: form.priceType,
      price: num(form.price),
      priceMax: num(form.priceMax),
      currency: form.currency.trim()
        ? form.currency.trim().toUpperCase()
        : null,
      durationMinutes: num(form.durationMinutes),
    };
    const ord = num(form.order);
    if (ord !== null) payload.order = ord;
    return payload;
  };

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateService(editingId, payload);
      } else {
        await createService(payload);
      }
      await loadServices();
      closeForm();
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          t("services.saveError", { defaultValue: "Не удалось сохранить." }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (s) => {
    if (
      !window.confirm(
        t("services.confirmArchive", {
          defaultValue: `Архивировать услугу «${s.name}»?`,
        }),
      )
    )
      return;
    setError("");
    try {
      await archiveService(s._id || s.id);
      await loadServices();
    } catch (e) {
      setError(
        e?.response?.data?.error ||
          t("services.archiveError", {
            defaultValue: "Не удалось архивировать.",
          }),
      );
    }
  };

  // Формат цены для строки списка.
  const fmtPrice = (s) => {
    const cur = s.currency || "";
    const n = (v) =>
      typeof v === "number" ? new Intl.NumberFormat().format(v) : "";
    switch (s.priceType) {
      case "free":
        return t("services.priceType.free", { defaultValue: "бесплатно" });
      case "on_request":
        return t("services.priceType.on_request", {
          defaultValue: "по запросу",
        });
      case "from":
        return typeof s.price === "number"
          ? `${t("services.priceFromShort", { defaultValue: "от" })} ${n(s.price)} ${cur}`
          : "—";
      case "range":
        return typeof s.price === "number" && typeof s.priceMax === "number"
          ? `${n(s.price)}–${n(s.priceMax)} ${cur}`
          : typeof s.price === "number"
            ? `${n(s.price)} ${cur}`
            : "—";
      case "fixed":
      default:
        return typeof s.price === "number" ? `${n(s.price)} ${cur}` : "—";
    }
  };

  if (loading) {
    return (
      <div className="svp">
        <style>{CSS}</style>
        <p style={{ color: "#78716c" }}>
          {t("common.loading", { defaultValue: "Загрузка…" })}
        </p>
      </div>
    );
  }

  // Группировка для отображения: по отделению, затем «Без отдела».
  const byDept = new Map();
  const loose = [];
  for (const s of services) {
    const did = s.departmentId ? String(s.departmentId) : null;
    if (!did) {
      loose.push(s);
      continue;
    }
    if (!byDept.has(did)) byDept.set(did, []);
    byDept.get(did).push(s);
  }

  const renderItem = (s) => (
    <div
      className={"svp-item" + (s.status === "archived" ? " archived" : "")}
      key={s._id || s.id}
    >
      <span className="svp-item-name">{s.name}</span>
      <span className="svp-item-price">{fmtPrice(s)}</span>
      {typeof s.durationMinutes === "number" && s.durationMinutes > 0 && (
        <span className="svp-item-dur">
          {s.durationMinutes} {t("services.minShort", { defaultValue: "мин" })}
        </span>
      )}
      {s.status === "archived" && (
        <span className="svp-badge archived">
          {t("services.statusArchived", { defaultValue: "архив" })}
        </span>
      )}
      {canWrite && (
        <>
          <button type="button" className="svp-act" onClick={() => openEdit(s)}>
            {t("common.edit", { defaultValue: "Редактировать" })}
          </button>
          {s.status !== "archived" && (
            <button
              type="button"
              className="svp-act danger"
              onClick={() => handleArchive(s)}
            >
              {t("services.archive", { defaultValue: "Архивировать" })}
            </button>
          )}
        </>
      )}
      {s.description && <div className="svp-item-desc">{s.description}</div>}
    </div>
  );

  return (
    <div className="svp">
      <style>{CSS}</style>

      <div className="svp-head">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            className="svp-btn svp-btn-ghost"
            onClick={() => navigate("/clinic/dashboard")}
          >
            ← {t("services.backToDashboard", { defaultValue: "В дашборд" })}
          </button>
          <h1 className="svp-title">
            {t("services.title", { defaultValue: "Услуги и прайс" })}
          </h1>
        </div>
        {canWrite && !showForm && (
          <button
            type="button"
            className="svp-btn svp-btn-primary"
            onClick={openCreate}
          >
            {t("services.addService", { defaultValue: "Добавить услугу" })}
          </button>
        )}
      </div>

      {error && <div className="svp-error">{error}</div>}

      {showForm && (
        <div className="svp-form">
          <h2 className="svp-form-title">
            {editingId
              ? t("services.editService", {
                  defaultValue: "Редактирование услуги",
                })
              : t("services.newService", { defaultValue: "Новая услуга" })}
          </h2>

          <div className="svp-row">
            <div className="svp-field full">
              <label className="svp-label">
                {t("services.name", { defaultValue: "Название" })}
              </label>
              <input
                className="svp-input"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          <div className="svp-row">
            <div className="svp-field full">
              <label className="svp-label">
                {t("services.description", { defaultValue: "Описание" })}
              </label>
              <textarea
                className="svp-textarea"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                maxLength={2000}
              />
            </div>
          </div>

          <div className="svp-row">
            <div className="svp-field">
              <label className="svp-label">
                {t("services.department", { defaultValue: "Отделение" })}
              </label>
              <select
                className="svp-select"
                value={form.departmentId}
                onChange={(e) => setField("departmentId", e.target.value)}
              >
                <option value="">
                  {t("services.noDepartment", {
                    defaultValue: "— Без отдела —",
                  })}
                </option>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="svp-field">
              <label className="svp-label">
                {t("services.priceTypeLabel", { defaultValue: "Тип цены" })}
              </label>
              <select
                className="svp-select"
                value={form.priceType}
                onChange={(e) => setField("priceType", e.target.value)}
              >
                {PRICE_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(`services.priceType.${pt}`, { defaultValue: pt })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Цена — скрываем для free/on_request */}
          {form.priceType !== "free" && form.priceType !== "on_request" && (
            <div className="svp-row">
              <div className="svp-field">
                <label className="svp-label">
                  {form.priceType === "range"
                    ? t("services.priceFrom", { defaultValue: "Цена от" })
                    : t("services.price", { defaultValue: "Цена" })}
                </label>
                <input
                  className="svp-input"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                />
              </div>
              {form.priceType === "range" && (
                <div className="svp-field">
                  <label className="svp-label">
                    {t("services.priceTo", { defaultValue: "Цена до" })}
                  </label>
                  <input
                    className="svp-input"
                    type="number"
                    min="0"
                    value={form.priceMax}
                    onChange={(e) => setField("priceMax", e.target.value)}
                  />
                </div>
              )}
              <div className="svp-field">
                <label className="svp-label">
                  {t("services.currency", { defaultValue: "Валюта" })}
                </label>
                <input
                  className="svp-input"
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                  maxLength={3}
                  placeholder="AZN"
                />
              </div>
            </div>
          )}

          <div className="svp-row">
            <div className="svp-field">
              <label className="svp-label">
                {t("services.duration", { defaultValue: "Длительность, мин" })}
              </label>
              <input
                className="svp-input"
                type="number"
                min="0"
                value={form.durationMinutes}
                onChange={(e) => setField("durationMinutes", e.target.value)}
              />
            </div>
            <div className="svp-field">
              <label className="svp-label">
                {t("services.order", { defaultValue: "Порядок" })}
              </label>
              <input
                className="svp-input"
                type="number"
                value={form.order}
                onChange={(e) => setField("order", e.target.value)}
              />
            </div>
          </div>

          <div className="svp-form-actions">
            <button
              type="button"
              className="svp-btn svp-btn-primary"
              disabled={saving || !form.name.trim()}
              onClick={handleSave}
            >
              {saving
                ? t("common.saving", { defaultValue: "Сохранение…" })
                : t("common.save", { defaultValue: "Сохранить" })}
            </button>
            <button
              type="button"
              className="svp-btn svp-btn-ghost"
              onClick={closeForm}
            >
              {t("common.cancel", { defaultValue: "Отмена" })}
            </button>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="svp-empty">
          {t("services.noServices", {
            defaultValue: "Пока нет услуг. Добавьте первую выше.",
          })}
        </div>
      ) : (
        <>
          {[...byDept.entries()].map(([did, list]) => (
            <div className="svp-group" key={did}>
              <h3 className="svp-group-title">
                {deptNameById.get(did) ||
                  t("services.unknownDept", { defaultValue: "Отделение" })}
              </h3>
              <div className="svp-list">{list.map(renderItem)}</div>
            </div>
          ))}
          {loose.length > 0 && (
            <div className="svp-group">
              <h3 className="svp-group-title">
                {t("services.noDepartmentGroup", {
                  defaultValue: "Без отдела",
                })}
              </h3>
              <div className="svp-list">{loose.map(renderItem)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
