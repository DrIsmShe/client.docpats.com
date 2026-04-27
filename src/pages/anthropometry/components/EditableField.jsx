import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "../Anthropometry.module.css";

/* ─── EditableField ───────────────────────────────────────────
   Универсальный inline-edit для текстовых полей case-а.

   Props:
   - value: текущее значение
   - onSave: async (newValue) => void | throws
   - placeholder: текст для пустого состояния
   - disabled: нельзя редактировать (archived/deleted)
   - minRows: минимальная высота textarea
   ──────────────────────────────────────────────────────────── */

function EditableField({
  value,
  onSave,
  placeholder = "",
  disabled = false,
  minRows = 3,
}) {
  const { t } = useTranslation("Anthropometry");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

  /* автофокус при входе в режим редактирования */
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      // курсор в конец текста
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  /* синхронизация внешнего значения */
  useEffect(() => {
    if (!editing) setDraft(value || "");
  }, [value, editing]);

  const startEdit = () => {
    if (disabled) return;
    setDraft(value || "");
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(value || "");
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === (value || "").trim()) {
      // Нет изменений — просто выходим
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch (err) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter = save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
    // Escape = cancel
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  if (editing) {
    return (
      <div className={styles.editableEditing}>
        <textarea
          ref={textareaRef}
          className={styles.editableTextarea}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          rows={minRows}
          placeholder={placeholder}
        />
        {error && <div className={styles.editableError}>{error}</div>}
        <div className={styles.editableActions}>
          <button
            type="button"
            className={styles.editableBtnCancel}
            onClick={cancelEdit}
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={styles.editableBtnSave}
            onClick={save}
            disabled={saving}
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>
    );
  }

  /* Display mode */
  return (
    <div
      className={styles.editableDisplay}
      onClick={startEdit}
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          startEdit();
        }
      }}
    >
      {!disabled && (
        <span className={styles.editableEditHint}>✏ {t("common.edit")}</span>
      )}
      {value ? (
        <div className={styles.caseSectionBody}>{value}</div>
      ) : (
        <span className={styles.caseSectionEmpty}>
          {placeholder || t("common.noData")}
        </span>
      )}
    </div>
  );
}

export default EditableField;
