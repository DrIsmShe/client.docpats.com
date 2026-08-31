// client/src/pages/clinic/ClinicExamTemplatesPage/ExamTemplateFormModal.jsx
//
// Окно создания и правки заготовки протокола.
//
// Вид исследования и блок протокола здесь только ПОКАЗАНЫ, но не
// редактируются: они берутся из фильтров списка. Заготовка «заключение для
// КТ», превращённая в «название для МРТ», — это другая запись, а не правка
// существующей; сервер такую подмену тоже не примет.

import React, { useState } from "react";

import { useTranslation } from "react-i18next";
// Стили модалки, полей и кнопок живут в общих файлах кабинета клиники.
// Без них форма приезжала голой: подписи слева от полей, системные кнопки,
// текстовое поле поверх соседей. Родительская страница их не подключает, а
// класть в неё чужие стили ради дочернего окна неправильно — окно должно
// быть самодостаточным.
import "../ClinicPatientDetailPage/medicalRecordsSection.css";
import "../clinicForm.css";
import "../clinicPageShell.css";
export default function ExamTemplateFormModal({
  template,
  modalityLabel,
  kindLabel,
  onSave,
  onClose,
}) {
  const { t } = useTranslation("clinic");
  const [title, setTitle] = useState(template?.title || "");
  const [body, setBody] = useState(template?.body || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("examTemplates.titleRequired", { defaultValue: "Заголовок обязателен" }));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), body });
    } catch (err) {
      setError(err.response?.data?.error || t("examTemplates.saveFailed", { defaultValue: "Не удалось сохранить шаблон" }));
      setSaving(false);
    }
  }

  return (
    <div className="med-modal-overlay" onClick={onClose}>
      <div className="med-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="med-modal-head">
            <h3>
              {template ? t("examTemplates.editTitle", { defaultValue: "Изменить шаблон" }) : t("examTemplates.newTitle", { defaultValue: "Новый шаблон" })}
              <span className="exam-tpl-modal-context">
                {modalityLabel} · {kindLabel}
              </span>
            </h3>
            <button
              type="button"
              className="med-modal-close"
              onClick={onClose}
              disabled={saving}
            >
              ×
            </button>
          </div>

          <div className="med-modal-body">
            <div className="patients-form-field">
              <label>{t("examTemplates.heading")}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                autoFocus
                maxLength={300}
                placeholder={t("examTemplates.headingHint")}
              />
            </div>

            <div className="patients-form-field">
              <label>
                {t("examTemplates.text")}
                <span className="patients-form-optional">{t("common.optional")}</span>
              </label>
              <textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={saving}
                maxLength={20000}
                placeholder={t("examTemplates.textHint")}
              />
            </div>

            {/* Пояснение к пустому телу: у названий исследования оно обычно и
                не нужно — в поле подставится сам заголовок. */}
            {!body.trim() && (
              <div className="exam-tpl-hint">
                {t("examTemplates.emptyTextHint")}
              </div>
            )}

            {error && (
              <div className="patients-form-error patients-form-error-banner">
                {error}
              </div>
            )}
          </div>

          <div className="med-modal-foot">
            <button
              type="button"
              className="staff-page-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="staff-page-btn-primary"
              disabled={saving}
            >
              {saving ? t("common.submitting", { defaultValue: "Сохранение…" }) : t("common.save", { defaultValue: "Сохранить" })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
