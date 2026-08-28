import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useTranslation, Trans } from "react-i18next";
import instance from "../../axios";
import { getSocket } from "../communication/socket";
import styles from "./Surgery.module.css";
import sim from "./Simulator.module.css";
import { API_BASE } from "../../config";
import { PROCEDURE_GROUPS } from "./surgeryConstants";

const photoUrl = (filename) => `${API_BASE}/uploads/surgery/${filename}`;

export default function SimulatorPanel({ cas }) {
  const { t, i18n } = useTranslation("Surgery");

  const imgRef = useRef(null);
  // Якоря шагов: по подсказке под серой кнопкой «Сгенерировать» врача
  // уводят прямо к тому шагу, которого не хватает.
  const photoStepRef = useRef(null);
  const disclaimerStepRef = useRef(null);
  const [flashStep, setFlashStep] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  // Каталог зон правки целиком. Тип операции в кейсе и зона на снимке —
  // разные вещи: кейс заведён на брови, а посмотреть врач хочет нос.
  const [catalog, setCatalog] = useState({});
  const [zone, setZone] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [disclaimer, setDisclaimer] = useState(false);
  const [simulations, setSimulations] = useState([]);
  const [activeSimId, setActiveSimId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSims, setLoadingSims] = useState(true);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null); // { url, name }

  const caseId = cas?._id;

  // ─── Локаль для форматирования даты ──────────────────────────────────
  const dateLocale = useMemo(() => {
    const map = {
      ru: "ru-RU",
      en: "en-US",
      tr: "tr-TR",
      az: "az-AZ",
      ar: "ar",
    };
    return map[i18n.language] || "en-US";
  }, [i18n.language]);

  // ─── Лейблы статусов симуляций через t() ─────────────────────────────
  const simStatusLabels = useMemo(
    () => ({
      pending: t("simulator.simStatusPending"),
      processing: t("simulator.simStatusProcessing"),
      done: t("simulator.simStatusDone"),
      failed: t("simulator.simStatusFailed"),
    }),
    [t],
  );

  // ─── Загрузка симуляций ───────────────────────────────────────────────
  useEffect(() => {
    if (!caseId) return;
    setLoadingSims(true);
    instance
      .get(`/api/surgery/cases/${caseId}/simulations`)
      .then((r) => setSimulations(r.data.simulations || []))
      .catch(() => {})
      .finally(() => setLoadingSims(false));
  }, [caseId]);

  // ─── Готовые описания результата ─────────────────────────────────────
  //
  // Каталог из восьмидесяти промтов лежал в сервисе мёртвым грузом: клиент
  // не запрашивал список и не передавал promptIdx, поэтому при пустом поле
  // запроса в модель всегда уходил нулевой пресет. Для блефаропластики это
  // «верхние веки» — врач просил убрать мешки под глазами, а модель
  // получала запрос на другую зону.
  useEffect(() => {
    instance
      .get("/api/surgery/prompts")
      .then((r) => {
        const map = {};
        for (const row of r.data.catalog || []) map[row.procedure] = row.prompts;
        setCatalog(map);
      })
      .catch(() => setCatalog({}));
  }, []);

  // Зона по умолчанию — процедура кейса, если для неё есть описания.
  useEffect(() => {
    const p = cas?.procedure;
    setZone(p && catalog[p] ? p : "");
    setPromptIdx(0);
  }, [cas?.procedure, catalog]);

  // ─── Фото для выбора ─────────────────────────────────────────────────
  useEffect(() => {
    const p = (cas?.photos || []).filter((p) =>
      ["before", "after", "intra_op"].includes(p.label),
    );
    setPhotos(p);
    if (p.length > 0) setSelectedPhoto(p[0]);
  }, [cas]);

  // ─── Socket.IO ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onProcessing = ({ simulationId }) =>
      setSimulations((prev) =>
        prev.map((s) =>
          s._id === simulationId ? { ...s, status: "processing" } : s,
        ),
      );
    const onDone = ({ simulationId, resultFilenames }) => {
      setSimulations((prev) =>
        prev.map((s) =>
          s._id === simulationId
            ? { ...s, status: "done", resultFilenames }
            : s,
        ),
      );
      setLoading(false);
      setActiveSimId(simulationId);
    };
    const onFailed = ({ simulationId, error: errMsg }) => {
      setSimulations((prev) =>
        prev.map((s) =>
          s._id === simulationId ? { ...s, status: "failed" } : s,
        ),
      );
      setLoading(false);
      setError(`${t("simulator.errorPrefix")}: ${errMsg}`);
    };
    socket.on("simulation:processing", onProcessing);
    socket.on("simulation:done", onDone);
    socket.on("simulation:failed", onFailed);
    return () => {
      socket.off("simulation:processing", onProcessing);
      socket.off("simulation:done", onDone);
      socket.off("simulation:failed", onFailed);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Увести к нужному шагу и подсветить его на секунду.
  const focusStep = useCallback((key, ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashStep(key);
    window.setTimeout(() => setFlashStep(null), 1700);
  }, []);

  // Чего не хватает для генерации. Те же три условия, что в handleGenerate,
  // но показанные ДО клика: по отключённой кнопке кликнуть нельзя, и её
  // setError никогда не срабатывал — врач видел серую кнопку без причины.
  const gate = [];
  if (!selectedPhoto)
    gate.push({
      key: "photo",
      text: t("simulator.errorSelectPhoto"),
      ref: photoStepRef,
    });
  if (!disclaimer)
    gate.push({
      key: "disclaimer",
      text: t("simulator.errorAcceptDisclaimer"),
      ref: disclaimerStepRef,
    });

  // ─── Генерация ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedPhoto) return setError(t("simulator.errorSelectPhoto"));
    if (!disclaimer) return setError(t("simulator.errorAcceptDisclaimer"));
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("sourcePhotoFilename", selectedPhoto.filename);
      formData.append("disclaimerAccepted", "true");
      // promptIdx нужен всегда: при пустом поле пожеланий сервер берёт
      // пресет каталога по этому номеру, и без него это был вечный нулевой.
      formData.append("promptIdx", String(promptIdx));
      if (zone) formData.append("promptProcedure", zone);
      if (customPrompt) formData.append("customPrompt", customPrompt);
      const res = await instance.post(
        `/api/surgery/cases/${caseId}/simulate`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setSimulations((prev) => [res.data.simulation, ...prev]);
      setActiveSimId(res.data.simulation._id);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || t("simulator.errorLaunch"));
    }
  };

  const handleSelect = async (simId, idx) => {
    try {
      await instance.put(`/api/surgery/simulations/${simId}/select`, { idx });
      setSimulations((prev) =>
        prev.map((s) => (s._id === simId ? { ...s, selectedIdx: idx } : s)),
      );
    } catch {}
  };

  const handleDelete = async (simId) => {
    if (!window.confirm(t("simulator.confirmDelete"))) return;
    try {
      await instance.delete(`/api/surgery/simulations/${simId}`);
      setSimulations((prev) => prev.filter((s) => s._id !== simId));
      if (activeSimId === simId) setActiveSimId(null);
    } catch {}
  };

  // ─── Скачать фото ────────────────────────────────────────────────────
  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <>
      {/* ─── Лайтбокс ───────────────────────────────────────────────── */}
      {lightbox && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt={lightbox.name}
            style={{
              maxWidth: "90vw",
              maxHeight: "80vh",
              borderRadius: 8,
              objectFit: "contain",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            style={{ display: "flex", gap: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDownload(lightbox.url, lightbox.name)}
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 14,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {t("simulator.download")}
            </button>
            <button
              onClick={() => setLightbox(null)}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {t("simulator.close")}
            </button>
          </div>
        </div>
      )}

      <div className={sim.panel}>
        {/* ─── Левая колонка: редактор ── */}
        <div className={sim.editor}>
          <div
            className={`${sim.section} ${flashStep === "photo" ? sim.flash : ""}`}
            ref={photoStepRef}
          >
            <div className={sim.sectionTitle}>{t("simulator.sourcePhoto")}</div>
            {photos.length === 0 ? (
              <p className={styles.empty}>{t("simulator.uploadFirst")}</p>
            ) : (
              <div className={sim.photoStrip}>
                {photos.map((p) => (
                  <div
                    key={p._id}
                    className={`${sim.photoChip} ${selectedPhoto?._id === p._id ? sim.photoChipActive : ""}`}
                    onClick={() => setSelectedPhoto(p)}
                  >
                    <img
                      src={photoUrl(p.filename)}
                      alt={t(`photoLabels.${p.label}`, p.label)}
                      className={sim.photoChipImg}
                    />
                    <span className={sim.photoChipLbl}>
                      {t(`photoLabels.${p.label}`, p.label)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={sim.section}>
            <div className={sim.sectionTitle}>
              {t("simulator.requestTitle")}
              <span className={sim.sectionHint}>
                {t("simulator.requestHint")}
              </span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder={t("simulator.requestPlaceholder")}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
            />
            {/* Модель изображений не выполняет действия и не понимает
                градусов — сервер переписывает текст врача в описание
                желаемого вида. Сказать об этом здесь честнее, чем молча
                подменить запрос: иначе результат «сделал наоборот»
                выглядит поломкой, а не непониманием. */}
            <p className={sim.sectionHint}>
              {t("simulator.requestCompilerHint")}
            </p>
          </div>

          {/* Снимок показываем как есть, без слоёв поверх.
              Выделение зоны отсюда убрано совсем: модель находит лицо и
              нужную область сама, а навязанная маска только мешала ей —
              она получала вырезанный кусок кадра и дорисовывала в нём
              чужую анатомию. */}
          {selectedPhoto && (
            <div className={sim.section}>
              <div className={sim.canvasWrap}>
                <img
                  src={photoUrl(selectedPhoto.filename)}
                  alt={t("simulator.sourcePhoto")}
                  ref={imgRef}
                  className={sim.canvasImg}
                  draggable={false}
                />
              </div>
            </div>
          )}

          {/* Зона правки и готовое описание результата.
              Список зон — весь каталог, а не одна процедура кейса: кейс
              заведён на брови, а посмотреть врач может нос, грудь или
              живот. Названия зон переводятся клиентскими ключами
              procedures.* — они уже есть на всех пяти языках. */}
          {Object.keys(catalog).length > 0 && (
            <div className={sim.section}>
              <div className={sim.sectionTitle}>
                {t("simulator.zone")}
                <span className={sim.sectionHint}>{t("simulator.presetHint")}</span>
              </div>
              <select
                className={styles.select}
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  setPromptIdx(0);
                }}
                disabled={Boolean(customPrompt.trim())}
              >
                <option value="">{t("simulator.zoneAny")}</option>
                {PROCEDURE_GROUPS.map((g) => {
                  const items = g.items.filter((k) => catalog[k]);
                  if (!items.length) return null;
                  return (
                    <optgroup
                      key={g.groupKey}
                      label={t(`procedureGroups.${g.groupKey}`, g.groupKey)}
                    >
                      {items.map((k) => (
                        <option key={k} value={k}>
                          {t(`procedures.${k}`, k)}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>

              {(catalog[zone] || []).length > 1 && (
                <select
                  className={styles.select}
                  style={{ marginTop: 8 }}
                  value={promptIdx}
                  onChange={(e) => setPromptIdx(Number(e.target.value))}
                  disabled={Boolean(customPrompt.trim())}
                >
                  {catalog[zone].map((p) => (
                    <option key={p.idx} value={p.idx}>
                      {p.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className={sim.section}>
            <div className={sim.sectionTitle}>
              {t("simulator.requestTitle")}
              <span className={sim.sectionHint}>
                {t("simulator.requestHint")}
              </span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder={t("simulator.requestPlaceholder")}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
            />
            {/* Модель изображений не выполняет действия и не понимает
                градусов — сервер переписывает текст врача в описание
                желаемого вида. Сказать об этом здесь честнее, чем молча
                подменить запрос: иначе результат «сделал наоборот»
                выглядит поломкой, а не непониманием. */}
            <p className={sim.sectionHint}>
              {t("simulator.requestCompilerHint")}
            </p>
          </div>

          {/* Снимок показываем как есть, без слоёв поверх.
              Выделение зоны отсюда убрано совсем: модель находит лицо и
              нужную область сама, а навязанная маска только мешала ей —
              она получала вырезанный кусок кадра и дорисовывала в нём
              чужую анатомию. */}
          {selectedPhoto && (
            <div className={sim.section}>
              <div className={sim.canvasWrap}>
                <img
                  src={photoUrl(selectedPhoto.filename)}
                  alt={t("simulator.sourcePhoto")}
                  ref={imgRef}
                  className={sim.canvasImg}
                  draggable={false}
                />
              </div>
            </div>
          )}

          {/* Готовое описание результата. Каталог пресетов существовал в
              сервисе с самого начала, но клиент его не показывал и номер
              не передавал — в модель всегда уходил нулевой вариант. Для
              блефаропластики это «верхние веки», хотя врач мог оперировать
              нижние. */}
          <label
            className={`${styles.checkRow} ${sim.disclaimer} ${flashStep === "disclaimer" ? sim.flash : ""}`}
            ref={disclaimerStepRef}
          >
            <input
              type="checkbox"
              checked={disclaimer}
              onChange={(e) => setDisclaimer(e.target.checked)}
            />
            <span>
              <Trans
                i18nKey="simulator.disclaimer"
                ns="Surgery"
                components={{ 1: <strong /> }}
              />
            </span>
          </label>

          {error && <div className={styles.errorBox}>{error}</div>}

          <button
            className={`${styles.btnPrimary} ${sim.generateBtn}`}
            onClick={handleGenerate}
            disabled={
              loading ||
              !selectedPhoto || !disclaimer
            }
          >
            {loading ? (
              <>
                <span className={sim.spinner} />{" "}
                {/* Честное ожидание: gpt-image-2 отдаёт два варианта за
                    ~100 секунд, четыре — заметно дольше. Обещание «~30 сек»
                    превращало нормальную работу в подозрение, что всё
                    зависло. */}
                {t("simulator.generatingWithTime", { sec: 120 })}
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1l1.5 4.5L13 7l-4.5 1.5L7 13l-1.5-4.5L1 7l4.5-1.5L7 1z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
                {t("simulator.generate", { count: 4 })}
              </>
            )}
          </button>

          {/* Почему кнопка серая. Каждый пункт — ссылка на свой шаг. */}
          {!loading && gate.length > 0 && (
            <div className={sim.gateHint}>
              <span className={sim.gateHintLabel}>
                {t("simulator.gateHint")}
              </span>{" "}
              {gate.map((g, i) => (
                <span key={g.key}>
                  {i > 0 ? "; " : ""}
                  <button
                    type="button"
                    className={sim.gateLink}
                    onClick={() => focusStep(g.key, g.ref)}
                  >
                    {g.text}
                  </button>
                </span>
              ))}
              .
            </div>
          )}
        </div>

        {/* ─── Правая колонка: результаты ── */}
        <div className={sim.results}>
          <div className={sim.sectionTitle}>{t("simulator.history")}</div>

          {loadingSims ? (
            <p className={styles.empty}>{t("page.loading")}</p>
          ) : simulations.length === 0 ? (
            <div className={sim.emptyResults}>
              <div className={sim.emptyResultsIcon}>✦</div>
              <p>{t("simulator.noHistory")}</p>
              <p className={sim.emptyResultsSub}>
                {t("simulator.noHistoryHint")}
              </p>
            </div>
          ) : (
            simulations.map((s) => (
              <div
                key={s._id}
                className={`${sim.simCard} ${activeSimId === s._id ? sim.simCardActive : ""}`}
              >
                <div
                  className={sim.simCardHead}
                  onClick={() =>
                    setActiveSimId(s._id === activeSimId ? null : s._id)
                  }
                >
                  <span className={sim.simDate}>
                    {new Date(s.createdAt).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`${sim.simStatus} ${sim["simStatus_" + s.status]}`}
                  >
                    {simStatusLabels[s.status] || s.status}
                  </span>
                  <button
                    className={styles.btnDeleteSmall}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(s._id);
                    }}
                    aria-label={t("simulator.delete")}
                  >
                    ×
                  </button>
                </div>

                {s.status === "processing" && (
                  <div className={sim.processingBar}>
                    <div className={sim.processingFill} />
                    <span className={sim.processingText}>
                      {t("simulator.falaiProcessing")}
                    </span>
                  </div>
                )}

                {/* Что реально ушло в модель. Без этого разобраться,
                    почему результат не тот — запрос врача виноват или его
                    перевод, — нельзя ни ему, ни нам. */}
                {activeSimId === s._id && (s.promptFinal || s.prompt) && (
                  <details className={sim.sectionHint} style={{ padding: "6px 0" }}>
                    <summary style={{ cursor: "pointer" }}>
                      {t("simulator.promptSent", "Что было отправлено модели")}
                    </summary>
                    {s.promptRaw && (
                      <p style={{ margin: "6px 0 0" }}>
                        <b>{t("simulator.promptYours", "Ваш запрос")}:</b>{" "}
                        {s.promptRaw}
                      </p>
                    )}
                    {/* Кого модель считала изображённым на снимке. Пустая
                        строка здесь — прямая причина «получился другой
                        человек»: без описания субъекта модель берёт
                        среднее по обучающей выборке. */}
                    {s.subjectDescription && (
                      <p style={{ margin: "4px 0 0", opacity: 0.85 }}>
                        <b>{t("simulator.promptSubject", "Кто на фото")}:</b>{" "}
                        {s.subjectDescription}
                      </p>
                    )}
                    <p style={{ margin: "4px 0 0", opacity: 0.85 }}>
                      <b>{t("simulator.promptModel", "Для модели")}:</b>{" "}
                      {s.promptFinal || s.prompt}
                    </p>
                    {/* Геометрия правки. Без этих цифр разбор жалобы на
                        результат упирается в логи воркера, которых у врача
                        нет. */}
                    {/* Сама маска. Строка «отмечено N%» не показывает
                        ФОРМУ выделения, а именно форма объясняет результат:
                        обведённый контур вместо залитой зоны выглядит на
                        снимке чертой по следу кисти. */}
                    {s.maskFilename && (
                      <div style={{ margin: "6px 0 0" }}>
                        <b>{t("simulator.maskPreview", "Что закрашено")}:</b>
                        <img
                          src={photoUrl(s.maskFilename)}
                          alt={t("simulator.maskPreview", "Что закрашено")}
                          style={{
                            display: "block",
                            marginTop: 4,
                            maxWidth: 140,
                            borderRadius: 6,
                            background: "#000",
                          }}
                        />
                      </div>
                    )}
                    {s.maskStats?.paintedPct != null && (
                      <p style={{ margin: "4px 0 0", opacity: 0.85 }}>
                        <b>{t("simulator.maskArea", "Область правки")}:</b>{" "}
                        {t("simulator.maskCoverage", {
                          pct: Number(s.maskStats.paintedPct).toFixed(1),
                        })}
                        {s.maskStats.width
                          ? ` · ${s.maskStats.width}×${s.maskStats.height}`
                          : ""}
                        {s.provider ? ` · ${s.provider}` : ""}
                      </p>
                    )}
                  </details>
                )}

                {s.status === "done" && activeSimId === s._id && (
                  <div className={sim.resultGrid}>
                    {(s.resultFilenames || []).map((fn, i) => {
                      const url = photoUrl(fn);
                      const variantLabel = t("simulator.variant", { n: i + 1 });
                      return (
                        <div
                          key={i}
                          className={`${sim.resultItem} ${s.selectedIdx === i ? sim.resultItemSelected : ""}`}
                        >
                          <img
                            src={url}
                            alt={variantLabel}
                            className={sim.resultImg}
                            onClick={() =>
                              setLightbox({
                                url,
                                name: `simulation-variant-${i + 1}.jpg`,
                              })
                            }
                            style={{ cursor: "zoom-in" }}
                          />
                          <div className={sim.resultActions}>
                            <button
                              className={sim.resultSelectBtn}
                              onClick={() => handleSelect(s._id, i)}
                            >
                              {s.selectedIdx === i
                                ? t("simulator.selected")
                                : variantLabel}
                            </button>
                            <button
                              className={sim.resultDownloadBtn}
                              onClick={() =>
                                handleDownload(
                                  url,
                                  `simulation-variant-${i + 1}.jpg`,
                                )
                              }
                              title={t("simulator.download")}
                              aria-label={t("simulator.download")}
                            >
                              ↓
                            </button>
                            <button
                              className={sim.resultZoomBtn}
                              onClick={() =>
                                setLightbox({
                                  url,
                                  name: `simulation-variant-${i + 1}.jpg`,
                                })
                              }
                              title={t("simulator.zoom")}
                              aria-label={t("simulator.zoom")}
                            >
                              ⤢
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {s.status === "failed" && (
                  <p className={sim.failedMsg}>
                    {s.errorMessage || t("simulator.unknownError")}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
