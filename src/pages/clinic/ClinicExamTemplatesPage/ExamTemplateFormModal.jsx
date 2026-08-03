// client/src/pages/clinic/ClinicExamTemplatesPage/ExamTemplateFormModal.jsx
//
// Окно создания и правки заготовки протокола.
//
// Вид исследования и блок протокола здесь только ПОКАЗАНЫ, но не
// редактируются: они берутся из фильтров списка. Заготовка «заключение для
// КТ», превращённая в «название для МРТ», — это другая запись, а не правка
// существующей; сервер такую подмену тоже не примет.

import React, { useState } from "react";

export default function ExamTemplateFormModal({
  template,
  modalityLabel,
  kindLabel,
  onSave,
  onClose,
}) {
  const [title, setTitle] = useState(template?.title || "");
  const [body, setBody] = useState(template?.body || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Заголовок обязателен");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), body });
    } catch (err) {
      setError(err.response?.data?.error || "Не удалось сохранить шаблон");
      setSaving(false);
    }
  }

  return (
    <div className="med-modal-overlay" onClick={onClose}>
      <div className="med-modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="med-modal-head">
            <h3>
              {template ? "Изменить шаблон" : "Новый шаблон"}
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
              <label>Заголовок</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                autoFocus
                maxLength={300}
                placeholder="Коротко — как формулировка называется в списке"
              />
            </div>

            <div className="patients-form-field">
              <label>
                Текст
                <span className="patients-form-optional">необязательно</span>
              </label>
              <textarea
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={saving}
                maxLength={20000}
                placeholder="Текст, который подставится в поле протокола"
              />
            </div>

            {/* Пояснение к пустому телу: у названий исследования оно обычно и
                не нужно — в поле подставится сам заголовок. */}
            {!body.trim() && (
              <div className="exam-tpl-hint">
                Если текст не заполнен, в поле подставится заголовок.
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
              Отмена
            </button>
            <button
              type="submit"
              className="staff-page-btn-primary"
              disabled={saving}
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
