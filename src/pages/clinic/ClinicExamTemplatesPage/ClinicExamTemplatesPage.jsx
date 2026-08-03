// client/src/pages/clinic/ClinicExamTemplatesPage/ClinicExamTemplatesPage.jsx
//
// Справочник заготовок для протоколов исследований.
//
// ЧТО ЭТО. Готовые формулировки, из которых врач собирает протокол: название
// исследования, типовой протокол, частое заключение, рекомендации. В форме
// исследования они появляются кнопкой «Шаблоны» рядом с полем.
//
// ОТЛИЧИЕ ОТ ЕДИНОЛИЧНОЙ ПРАКТИКИ. В модуле myClinic на каждый вид
// исследования заведён свой экран, и таких экранов под три сотни. Здесь один
// экран: вид исследования и блок протокола — это фильтры, а не отдельные
// страницы. Набор формулировок при этом общий для всей клиники, а не личный
// для каждого врача, — иначе каждый новый сотрудник набивал бы их заново.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  listExaminationTemplates,
  createExaminationTemplate,
  updateExaminationTemplate,
  deleteExaminationTemplate,
} from "../../../api/examinationTemplates";
import { MODALITIES, TEMPLATE_KINDS, modalityLabel } from "../examinationModalities";
import ExamTemplateFormModal from "./ExamTemplateFormModal";
import "./clinicExamTemplatesPage.css";

export default function ClinicExamTemplatesPage() {
  const layoutContext = useOutletContext();

  const [modality, setModality] = useState(MODALITIES[0].key);
  const [kind, setKind] = useState(TEMPLATE_KINDS[0].key);
  const [search, setSearch] = useState("");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // null — окно закрыто; {} — создание; объект заготовки — правка.
  const [editing, setEditing] = useState(null);

  // Права те же, что на сервере: врач и заведующий пополняют справочник,
  // медсестра только читает. UI лишь прячет кнопки — решает всё равно сервер.
  const myRole = layoutContext?.role || "member";
  const canManage = ["owner", "admin", "manager", "doctor"].includes(myRole);
  const canDelete = ["owner", "admin"].includes(myRole);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listExaminationTemplates({ modality, kind }));
    } catch (err) {
      setError(
        err.response?.data?.error || "Не удалось загрузить шаблоны протоколов",
      );
    } finally {
      setLoading(false);
    }
  }, [modality, kind]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (tpl) =>
        (tpl.title || "").toLowerCase().includes(q) ||
        (tpl.body || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  async function handleSave(values) {
    if (editing && editing._id) {
      await updateExaminationTemplate(editing._id, values);
    } else {
      await createExaminationTemplate({ ...values, modality, kind });
    }
    setEditing(null);
    load();
  }

  async function handleDelete(tpl) {
    // Заготовка не связана с уже сохранёнными исследованиями: её текст туда
    // скопирован, а не подтянут ссылкой. Поэтому удаление ничего не портит
    // задним числом, и подтверждения хватает обычного.
    if (!window.confirm(`Удалить шаблон «${tpl.title}»?`)) return;
    try {
      await deleteExaminationTemplate(tpl._id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Не удалось удалить шаблон");
    }
  }

  const kindLabel = TEMPLATE_KINDS.find((k) => k.key === kind)?.label || "";

  return (
    <div className="exam-tpl-page">
      <header className="exam-tpl-head">
        <div>
          <h1 className="exam-tpl-title">Шаблоны протоколов</h1>
          <p className="exam-tpl-subtitle">
            Готовые формулировки для заполнения исследований. Врач выбирает их
            кнопкой «Шаблоны» в форме исследования. Набор общий для всей клиники.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="staff-page-btn-primary"
            onClick={() => setEditing({})}
          >
            Добавить шаблон
          </button>
        )}
      </header>

      <div className="exam-tpl-filters">
        <label className="exam-tpl-filter">
          <span>Исследование</span>
          <select value={modality} onChange={(e) => setModality(e.target.value)}>
            {MODALITIES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="exam-tpl-filter">
          <span>Блок протокола</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {TEMPLATE_KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>

        <label className="exam-tpl-filter exam-tpl-filter--grow">
          <span>Поиск</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="По заголовку или тексту"
          />
        </label>
      </div>

      {error && <div className="exam-tpl-error">{error}</div>}

      {loading ? (
        <div className="exam-tpl-state">Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div className="exam-tpl-state">
          {items.length === 0
            ? `Для «${modalityLabel(modality)}» в блоке «${kindLabel}» шаблонов пока нет.`
            : "Ничего не найдено"}
        </div>
      ) : (
        <ul className="exam-tpl-list">
          {filtered.map((tpl) => (
            <li key={tpl._id} className="exam-tpl-card">
              <div className="exam-tpl-card__main">
                <div className="exam-tpl-card__title">{tpl.title}</div>
                {tpl.body && (
                  <div className="exam-tpl-card__body">{tpl.body}</div>
                )}
              </div>
              {canManage && (
                <div className="exam-tpl-card__actions">
                  <button
                    type="button"
                    className="staff-page-btn-secondary"
                    onClick={() => setEditing(tpl)}
                  >
                    Изменить
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="exam-tpl-danger"
                      onClick={() => handleDelete(tpl)}
                    >
                      Удалить
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ExamTemplateFormModal
          template={editing._id ? editing : null}
          modalityLabel={modalityLabel(modality)}
          kindLabel={kindLabel}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
