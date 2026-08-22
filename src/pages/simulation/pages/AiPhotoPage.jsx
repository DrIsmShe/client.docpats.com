// client/src/pages/simulation/pages/AiPhotoPage.jsx
//
// «Моделирование → ИИ по фото»: снимок + область + промт → варианты «после».
//
// Сам инструмент здесь НЕ переписан. Рисование маски, каталог промтов,
// очередь, ожидание по сокету и галерея результатов живут в
// pages/surgery/SimulatorPanel.jsx и подключены как есть. Второй такой
// экран разошёлся бы с первым при первой же правке промтов, а промты —
// то, что правят чаще всего.
//
// Эта страница отвечает ровно за одно: довести врача до состояния, в
// котором SimulatorPanel может работать. Ему нужен СЛУЧАЙ с загруженной
// фотографией, и это не формальность: снимки пациента принадлежат
// случаю, а случай — врачу. Фотография вне случая означала бы хранилище
// медицинских изображений без владельца и без записи в аудите.
//
// Поэтому шага три: выбрать случай (или создать за один шаг) → загрузить
// снимок → работать. Уже готовый случай с фотографиями пропускает первые
// два и открывает редактор сразу.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import {
  fetchCases,
  fetchCaseById,
  createCase,
  uploadPhoto,
} from "../../surgery/surgerySlice";
import SimulatorPanel from "../../surgery/SimulatorPanel";
import styles from "./AiPhotoPage.module.css";

// Ключи процедур совпадают с каталогом промтов на сервере
// (modules/surgery/simulation.service.js). Расходиться им нельзя: для
// процедуры без записи в каталоге промты подставятся из "other".
const PROCEDURES = [
  { key: "rhinoplasty", label: "Ринопластика" },
  { key: "blepharoplasty", label: "Блефаропластика" },
  { key: "otoplasty", label: "Отопластика" },
  { key: "facelift", label: "Подтяжка лица" },
  { key: "chin_implant", label: "Ментопластика" },
  { key: "breast_augmentation", label: "Увеличение груди" },
  { key: "breast_reduction", label: "Уменьшение груди" },
  { key: "liposuction", label: "Липосакция" },
  { key: "abdominoplasty", label: "Абдоминопластика" },
  { key: "other", label: "Другое" },
];

const PHOTO_LABEL = "before";

const procedureLabel = (key) =>
  PROCEDURES.find((p) => p.key === key)?.label || key || "Без процедуры";

const caseTitle = (c) => {
  const date = c?.createdAt
    ? new Date(c.createdAt).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      })
    : "";
  const mark = c?.patientIdHash ? ` · ${c.patientIdHash}` : "";
  return `${procedureLabel(c?.procedure)}${mark}${date ? ` · ${date}` : ""}`;
};

export default function AiPhotoPage() {
  const dispatch = useDispatch();
  const { cases, activeCase, loading, caseLoading, uploadingPhoto } =
    useSelector((s) => s.surgery);

  const [selectedId, setSelectedId] = useState("");
  const [creating, setCreating] = useState(false);
  const [newProcedure, setNewProcedure] = useState("rhinoplasty");
  const [newMark, setNewMark] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(fetchCases({ limit: 100 }));
  }, [dispatch]);

  // Случай тянем отдельным запросом: в списке фотографий нет, а
  // SimulatorPanel без них не покажет ничего и будет выглядеть сломанным.
  useEffect(() => {
    if (selectedId) dispatch(fetchCaseById(selectedId));
  }, [dispatch, selectedId]);

  const photos = useMemo(
    () =>
      (activeCase?.photos || []).filter((p) =>
        ["before", "after", "intra_op"].includes(p.label),
      ),
    [activeCase],
  );

  const handleCreate = useCallback(async () => {
    setError("");
    try {
      const created = await dispatch(
        createCase({
          // Анонимный случай — намеренно. Привязка к карте пациента есть в
          // разделе «Хирургия»; здесь инструмент для быстрой примерки, и
          // требовать выбор пациента ради одной генерации избыточно.
          patientType: "anonymous",
          patientIdHash: newMark.trim(),
          procedure: newProcedure,
        }),
      ).unwrap();
      setSelectedId(created._id);
      setCreating(false);
      setNewMark("");
    } catch (err) {
      setError(typeof err === "string" ? err : "Не удалось создать случай");
    }
  }, [dispatch, newProcedure, newMark]);

  const handleUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      // Сбрасываем значение сразу: иначе повторный выбор того же файла
      // после ошибки не вызовет change и будет выглядеть как зависание.
      event.target.value = "";
      if (!file || !selectedId) return;

      setError("");
      try {
        await dispatch(
          uploadPhoto({ caseId: selectedId, file, label: PHOTO_LABEL }),
        ).unwrap();
        await dispatch(fetchCaseById(selectedId));
      } catch (err) {
        setError(typeof err === "string" ? err : "Не удалось загрузить фото");
      }
    },
    [dispatch, selectedId],
  );

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <p className={styles.kicker}>Моделирование · ИИ по фото</p>
        <h1 className={styles.title}>Снимок → область → результат</h1>
        <p className={styles.lead}>
          Выделите кистью участок, который должен измениться, и опишите
          желаемый результат. Нейросеть перерисует только выделенное,
          остальной кадр останется прежним.
        </p>
        <p className={styles.warn}>
          Результат — иллюстрация, а не прогноз операции. Одна и та же
          область с одним и тем же описанием каждый раз даёт другое
          изображение. Для измеримого плана используйте{" "}
          <Link to="/dp/simulation/face">разметку по ориентирам</Link>.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {/* ── Шаг 1: случай ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>1. Случай</h2>

        {!creating ? (
          <div className={styles.row}>
            <select
              className={styles.select}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loading}
            >
              <option value="">
                {loading ? "Загрузка…" : "— выберите случай —"}
              </option>
              {cases.map((c) => (
                <option key={c._id} value={c._id}>
                  {caseTitle(c)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setCreating(true)}
            >
              + Создать новый
            </button>
          </div>
        ) : (
          <div className={styles.row}>
            <select
              className={styles.select}
              value={newProcedure}
              onChange={(e) => setNewProcedure(e.target.value)}
            >
              {PROCEDURES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              className={styles.input}
              placeholder="Пометка (необязательно)"
              value={newMark}
              onChange={(e) => setNewMark(e.target.value)}
              maxLength={40}
            />
            <button
              type="button"
              className={styles.primary}
              onClick={handleCreate}
            >
              Создать
            </button>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setCreating(false)}
            >
              Отмена
            </button>
          </div>
        )}
      </section>

      {/* ── Шаг 2: фото ── */}
      {selectedId && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>2. Фотография</h2>

          {caseLoading ? (
            <p className={styles.muted}>Загрузка случая…</p>
          ) : (
            <>
              <p className={styles.muted}>
                {photos.length > 0
                  ? `Загружено снимков: ${photos.length}. Можно добавить ещё.`
                  : "Снимков пока нет — загрузите хотя бы один."}
              </p>
              <label className={styles.upload}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUpload}
                  disabled={uploadingPhoto}
                />
                <span>
                  {uploadingPhoto ? "Загрузка…" : "Выбрать фотографию"}
                </span>
              </label>
            </>
          )}
        </section>
      )}

      {/* ── Шаг 3: сам инструмент ──
          Отдаём управление SimulatorPanel только когда есть что показывать:
          пустой редактор без снимка читается как поломка. */}
      {selectedId && photos.length > 0 && activeCase && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>3. Область и описание</h2>
          <SimulatorPanel cas={activeCase} />
        </section>
      )}
    </div>
  );
}
