// client/src/pages/clinic/ClinicAnnouncementsPage/AnnouncementFormModal.jsx
//
// Create-announcement modal. Title + body + audience (whole clinic / a single
// department) + pin toggle. Departments are loaded for the "department" option.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createAnnouncement, listDepartments } from "../../../api/clinic";
import "./announcementFormModal.css";

export default function AnnouncementFormModal({ onClose, onCreated }) {
  const { t } = useTranslation("clinic");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [departmentId, setDepartmentId] = useState("");
  const [pinned, setPinned] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    listDepartments({})
      .then((data) => {
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
        setDepartments(list);
      })
      .catch(() => setDepartments([]));
  }, []);

  function validate() {
    const e = {};
    if (!title.trim())
      e.title = t("announcements.form.errors.titleRequired", {
        defaultValue: "Введите заголовок",
      });
    if (!body.trim())
      e.body = t("announcements.form.errors.bodyRequired", {
        defaultValue: "Введите текст",
      });
    if (audience === "department" && !departmentId)
      e.department = t("announcements.form.errors.departmentRequired", {
        defaultValue: "Выберите отделение",
      });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        audience,
        departmentId: audience === "department" ? departmentId : null,
        pinned,
      });
      onCreated?.();
    } catch (err) {
      setErrors({
        _form: t("announcements.form.errors.generic", {
          defaultValue: "Не удалось опубликовать объявление",
        }),
      });
      console.error("createAnnouncement:", err?.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ann-modal-overlay" onClick={onClose}>
      <div className="ann-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ann-modal-title">
          {t("announcements.form.createTitle", {
            defaultValue: "Новое объявление",
          })}
        </div>

        {errors._form && <div className="ann-modal-error">{errors._form}</div>}

        <label className="ann-modal-label">
          {t("announcements.form.titleLabel", { defaultValue: "Заголовок" })}
        </label>
        <input
          className="ann-modal-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("announcements.form.titlePlaceholder", {
            defaultValue: "Например: В понедельник собрание",
          })}
        />
        {errors.title && (
          <div className="ann-modal-field-err">{errors.title}</div>
        )}

        <label className="ann-modal-label">
          {t("announcements.form.bodyLabel", { defaultValue: "Текст" })}
        </label>
        <textarea
          className="ann-modal-textarea"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("announcements.form.bodyPlaceholder", {
            defaultValue: "Подробности объявления…",
          })}
        />
        {errors.body && (
          <div className="ann-modal-field-err">{errors.body}</div>
        )}

        <label className="ann-modal-label">
          {t("announcements.form.audience", { defaultValue: "Кому" })}
        </label>
        <select
          className="ann-modal-input"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        >
          <option value="all">
            {t("announcements.form.audienceAll", {
              defaultValue: "Вся клиника",
            })}
          </option>
          <option value="department">
            {t("announcements.form.audienceDepartment", {
              defaultValue: "Только отделение",
            })}
          </option>
        </select>

        {audience === "department" && (
          <>
            <label className="ann-modal-label">
              {t("announcements.form.department", {
                defaultValue: "Отделение",
              })}
            </label>
            <select
              className="ann-modal-input"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">
                {t("announcements.form.departmentNone", {
                  defaultValue: "— выберите отделение —",
                })}
              </option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.department && (
              <div className="ann-modal-field-err">{errors.department}</div>
            )}
          </>
        )}

        <label className="ann-modal-checkbox">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          {t("announcements.form.pin", { defaultValue: "Закрепить вверху" })}
        </label>

        <div className="ann-modal-actions">
          <button className="ann-modal-cancel" onClick={onClose}>
            {t("announcements.form.cancel", { defaultValue: "Отмена" })}
          </button>
          <button
            className="ann-modal-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? t("common.saving", { defaultValue: "Сохранение…" })
              : t("announcements.form.submit", {
                  defaultValue: "Опубликовать",
                })}
          </button>
        </div>
      </div>
    </div>
  );
}
