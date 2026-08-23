// client/src/pages/clinic/ClinicPatientDetailPage/ExaminationTemplatePicker.jsx
//
// Окно выбора готовой формулировки для блока протокола.
//
// Повторяет поведение единоличной практики (модуль myClinic): врач нажимает
// «Шаблоны» рядом с полем, выбирает формулировку из списка, и она
// подставляется в поле. Разница одна — там окно открывалось для каждого вида
// исследования из своего экрана, здесь оно одно и получает вид исследования
// параметром.
//
// Подстановка ЗАМЕЩАЕТ содержимое поля, как и в myClinic: заготовка — это
// начальный текст, который врач потом правит, а не вставка к написанному.

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { modalityLabel } from "../examinationModalities";

export default function ExaminationTemplatePicker({
  open,
  kindLabel,
  modality,
  items = [],
  onPick,
  onClose,
}) {
  const { t } = useTranslation("clinic");
  const [query, setQuery] = useState("");

  // Поиск по заголовку и тексту: у клиники формулировок бывает много, и
  // листать их глазами быстро становится неудобно.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (tpl) =>
        (tpl.title || "").toLowerCase().includes(q) ||
        (tpl.body || "").toLowerCase().includes(q),
    );
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="med-modal-overlay" onClick={onClose}>
      <div
        className="med-modal exam-template-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="med-modal-head">
          {/* Вид исследования дописываем, только если он есть: у блоков
              записи приёма (жалобы, анамнез) его не бывает. */}
          <h3>
            {kindLabel}
            {modality ? ` — ${modalityLabel(modality)}` : ""}
          </h3>
          <button type="button" className="med-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="med-modal-body">
          {items.length > 0 && (
            <div className="patients-form-field">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("examTemplates.pickerSearch")}
                autoFocus
              />
            </div>
          )}

          {items.length === 0 ? (
            <div className="med-empty">
              {t("examTemplates.pickerEmpty")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="med-empty">{t("common.nothingFound")}</div>
          ) : (
            <ul className="exam-template-list">
              {filtered.map((tpl) => (
                <li key={tpl._id}>
                  <button
                    type="button"
                    className="exam-template-item"
                    onClick={() => onPick(tpl)}
                  >
                    <span className="exam-template-title">{tpl.title}</span>
                    {tpl.body && (
                      <span className="exam-template-body">{tpl.body}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="med-modal-foot">
          <button
            type="button"
            className="staff-page-btn-secondary"
            onClick={onClose}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
