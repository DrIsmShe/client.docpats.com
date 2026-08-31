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
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import {
  listExaminationTemplates,
  createExaminationTemplate,
  updateExaminationTemplate,
  deleteExaminationTemplate,
} from "../../../api/examinationTemplates";
import {
  MODALITIES,
  TEMPLATE_KINDS,
  ENCOUNTER_BLOCKS,
  modalityLabelKey,
} from "../examinationModalities";
import ExamTemplateFormModal from "./ExamTemplateFormModal";
import "./clinicExamTemplatesPage.css";

// Две области применения заготовок. Разделены наглухо и на сервере: блок
// «жалобы» не может оказаться в протоколе КТ, и наоборот.
// Ключ перевода, а не готовая подпись: список вычисляется один раз при
// загрузке модуля, где переводчика ещё нет, а подпись нужна на языке того,
// кто смотрит.
const SCOPES = [
  {
    key: "examination",
    labelKey: "examTemplates.tabExams",
    label: "Обследования",
    blocks: TEMPLATE_KINDS,
  },
  {
    key: "encounter",
    labelKey: "examTemplates.tabHistory",
    label: "История болезни",
    blocks: ENCOUNTER_BLOCKS,
  },
];

export default function ClinicExamTemplatesPage() {
  const { t } = useTranslation("clinic");
  const layoutContext = useOutletContext();

  const [scope, setScope] = useState("examination");
  const [modality, setModality] = useState(MODALITIES[0].key);
  const [kind, setKind] = useState(TEMPLATE_KINDS[0].key);
  const [search, setSearch] = useState("");

  const currentScope = SCOPES.find((s) => s.key === scope) || SCOPES[0];
  const isEncounter = scope === "encounter";

  // При переключении области подставляем её первый блок: блоки у областей
  // разные, и оставленный от прежней области ключ вернул бы пустой список.
  function switchScope(next) {
    setScope(next);
    const blocks = SCOPES.find((s) => s.key === next)?.blocks || [];
    if (blocks.length) setKind(blocks[0].key);
  }

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
      setItems(
        await listExaminationTemplates({
          scope,
          // Вид исследования отправляем только для протоколов: у блоков
          // истории болезни его нет.
          modality: scope === "encounter" ? undefined : modality,
          kind,
        }),
      );
    } catch (err) {
      setError(
        err.response?.data?.error || t("examTemplates.loadFailed", { defaultValue: "Не удалось загрузить шаблоны" }),
      );
    } finally {
      setLoading(false);
    }
  }, [scope, modality, kind]);

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
      await createExaminationTemplate({
        ...values,
        scope,
        modality: isEncounter ? undefined : modality,
        kind,
      });
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
      setError(err.response?.data?.error || t("examTemplates.deleteFailed", { defaultValue: "Не удалось удалить шаблон" }));
    }
  }

  const kindItem = currentScope.blocks.find((k) => k.key === kind);
  const kindLabel = kindItem
    ? t(kindItem.labelKey, { defaultValue: kindItem.label })
    : "";

  return (
    <div className="exam-tpl-page">
      <header className="exam-tpl-head">
        <div>
          <h1 className="exam-tpl-title">{t("examTemplates.title")}</h1>
          <p className="exam-tpl-subtitle">
            {t("examTemplates.intro", {
              defaultValue:
                "Готовые формулировки для заполнения исследований и записей приёма. Врач выбирает их кнопкой «Шаблоны» рядом с полем. Набор общий для всей клиники.",
            })}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className="staff-page-btn-primary"
            onClick={() => setEditing({})}
          >
            {t("examTemplates.add")}
          </button>
        )}
      </header>

      {/* Область применения. Вкладками, а не выпадающим списком: это две
          разные части работы врача, и переключаются они часто. */}
      <nav className="exam-tpl-scopes">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`exam-tpl-scope${scope === s.key ? " is-active" : ""}`}
            onClick={() => switchScope(s.key)}
          >
            {t(s.labelKey, { defaultValue: s.label })}
          </button>
        ))}
      </nav>

      <div className="exam-tpl-filters">
        {/* Вид исследования — только для протоколов: у жалоб и анамнеза его
            не бывает. */}
        {!isEncounter && (
          <label className="exam-tpl-filter">
            <span>{t("examTemplates.study")}</span>
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
            >
              {MODALITIES.map((m) => (
                <option key={m.key} value={m.key}>
                  {t(m.labelKey, { defaultValue: m.label })}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="exam-tpl-filter">
          <span>{isEncounter ? t("examTemplates.section", { defaultValue: "Раздел записи" }) : t("examTemplates.block", { defaultValue: "Блок протокола" })}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {currentScope.blocks.map((k) => (
              <option key={k.key} value={k.key}>
                {t(k.labelKey, { defaultValue: k.label })}
              </option>
            ))}
          </select>
        </label>

        <label className="exam-tpl-filter exam-tpl-filter--grow">
          <span>{t("common.search")}</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("examTemplates.searchPlaceholder")}
          />
        </label>
      </div>

      {error && <div className="exam-tpl-error">{error}</div>}

      {loading ? (
        <div className="exam-tpl-state">{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="exam-tpl-state">
          {items.length === 0
            ? isEncounter
              ? t("examTemplates.emptyInBlock", {
                  block: kindLabel,
                  defaultValue: "В разделе «{{block}}» шаблонов пока нет.",
                })
              : t("examTemplates.emptyInStudyBlock", {
                  study: t(modalityLabelKey(modality), { defaultValue: modality }),
                  block: kindLabel,
                  defaultValue:
                    "Для «{{study}}» в блоке «{{block}}» шаблонов пока нет.",
                })
            : t("examTemplates.nothingFound", { defaultValue: "Ничего не найдено" })}
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
                    {t("common.edit")}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="exam-tpl-danger"
                      onClick={() => handleDelete(tpl)}
                    >
                      {t("common.delete")}
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
          modalityLabel={isEncounter ? t("examTemplates.tabHistory", { defaultValue: "История болезни" }) : t(modalityLabelKey(modality), { defaultValue: modality })}
          kindLabel={kindLabel}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
