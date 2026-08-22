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

const photoUrl = (filename) => `${API_BASE}/uploads/surgery/${filename}`;
const BRUSH_SIZES = [10, 20, 35, 50];

export default function SimulatorPanel({ cas }) {
  const { t, i18n } = useTranslation("Surgery");

  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
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

  // ─── Canvas drawing ───────────────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = useCallback(
    (e) => {
      e.preventDefault();
      const canvas = overlayRef.current;
      if (!canvas || !selectedPhoto) return;
      const ctx = canvas.getContext("2d");
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99,102,241,0.6)";
      ctx.fill();
      setIsDrawing(true);
      setHasMask(true);
    },
    [brushSize, selectedPhoto],
  );

  const draw = useCallback(
    (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = overlayRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99,102,241,0.6)";
      ctx.fill();
    },
    [isDrawing, brushSize],
  );

  const stopDraw = useCallback(() => setIsDrawing(false), []);

  const clearMask = () => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
  };

  // ─── Экспорт маски ────────────────────────────────────────────────────
  const getMaskBlob = () =>
    new Promise((resolve) => {
      const canvas = overlayRef.current;
      if (!canvas) return resolve(null);
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      const ctx = maskCanvas.getContext("2d");
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const overlayCtx = canvas.getContext("2d");
      const data = overlayCtx.getImageData(0, 0, canvas.width, canvas.height);
      const maskData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i + 3] > 10) {
          maskData.data[i] =
            maskData.data[i + 1] =
            maskData.data[i + 2] =
            maskData.data[i + 3] =
              255;
        }
      }
      ctx.putImageData(maskData, 0, 0);
      maskCanvas.toBlob(resolve, "image/png");
    });

  // ─── Генерация ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!selectedPhoto) return setError(t("simulator.errorSelectPhoto"));
    if (!hasMask) return setError(t("simulator.errorDrawMask"));
    if (!disclaimer) return setError(t("simulator.errorAcceptDisclaimer"));
    setError("");
    setLoading(true);
    try {
      const maskBlob = await getMaskBlob();
      const formData = new FormData();
      formData.append("sourcePhotoFilename", selectedPhoto.filename);
      formData.append("disclaimerAccepted", "true");
      if (customPrompt) formData.append("customPrompt", customPrompt);
      if (maskBlob) formData.append("mask", maskBlob, "mask.png");
      const res = await instance.post(
        `/api/surgery/cases/${caseId}/simulate`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setSimulations((prev) => [res.data.simulation, ...prev]);
      setActiveSimId(res.data.simulation._id);
      clearMask();
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

  const handleImgLoad = () => setImgLoaded(true);

  // Размер канваса задаётся ЗДЕСЬ, а не в onLoad изображения, и это не
  // вкусовщина.
  //
  // Канвас рендерится под условием {imgLoaded && …}, то есть появляется в
  // DOM только ПОСЛЕ того, как onLoad отработал. Присвоение размеров внутри
  // onLoad попадало в overlayRef.current === null, молча ничего не делало,
  // и канвас монтировался с дефолтными 300×150 — навсегда.
  //
  // Последствие было не косметическим: координаты мазка считаются как
  // canvas.width / rect.width, поэтому врач красил нос, а в маску попадало
  // крошечное пятно в другом месте кадра. Модель перерисовывала не то, и
  // результат выглядел как «другой человек, ничего не изменилось».
  useEffect(() => {
    const img = imgRef.current;
    const canvas = overlayRef.current;
    if (!img || !canvas) return;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return;
    if (canvas.width === w && canvas.height === h) return;

    // Присвоение width/height очищает содержимое канваса — при смене
    // фотографии это ровно то, что нужно: старая маска к новому снимку
    // не относится.
    canvas.width = w;
    canvas.height = h;
    setHasMask(false);
  }, [imgLoaded, selectedPhoto]);

  // Изображение из кеша браузера может не выдать onLoad вовсе: событие
  // успевает пройти до подписки. Тогда imgLoaded остаётся false, и канвас
  // не появляется — рисовать не по чему.
  useEffect(() => {
    if (imgRef.current?.complete && !imgLoaded) setImgLoaded(true);
  }, [selectedPhoto, imgLoaded]);

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
          <div className={sim.section}>
            <div className={sim.sectionTitle}>{t("simulator.sourcePhoto")}</div>
            {photos.length === 0 ? (
              <p className={styles.empty}>{t("simulator.uploadFirst")}</p>
            ) : (
              <div className={sim.photoStrip}>
                {photos.map((p) => (
                  <div
                    key={p._id}
                    className={`${sim.photoChip} ${selectedPhoto?._id === p._id ? sim.photoChipActive : ""}`}
                    onClick={() => {
                      setSelectedPhoto(p);
                      setImgLoaded(false);
                      clearMask();
                    }}
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

          {selectedPhoto && (
            <div className={sim.section}>
              <div className={sim.sectionTitle}>
                {t("simulator.drawMaskArea")}
                <span className={sim.sectionHint}>
                  {t("simulator.brushHint")}
                </span>
              </div>
              <div className={sim.toolbar}>
                {BRUSH_SIZES.map((sz) => (
                  <button
                    key={sz}
                    className={`${sim.brushBtn} ${brushSize === sz ? sim.brushBtnActive : ""}`}
                    onClick={() => setBrushSize(sz)}
                  >
                    <span
                      className={sim.brushPreview}
                      style={{
                        width: Math.min(sz, 28),
                        height: Math.min(sz, 28),
                      }}
                    />
                  </button>
                ))}
                <button className={sim.clearBtn} onClick={clearMask}>
                  {t("simulator.clearMask")}
                </button>
              </div>
              <div className={sim.canvasWrap}>
                <img
                  src={photoUrl(selectedPhoto.filename)}
                  alt={t("simulator.sourcePhoto")}
                  ref={imgRef}
                  className={sim.canvasImg}
                  onLoad={handleImgLoad}
                  draggable={false}
                />
                {imgLoaded && (
                  <canvas
                    ref={overlayRef}
                    className={sim.overlay}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    style={{
                      cursor: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><circle cx='${brushSize / 2}' cy='${brushSize / 2}' r='${brushSize / 2 - 1}' fill='rgba(99,102,241,0.5)' stroke='%236366f1' stroke-width='1'/></svg>") ${brushSize / 2} ${brushSize / 2}, crosshair`,
                    }}
                  />
                )}
              </div>
              {hasMask && (
                <div className={sim.maskHint}>{t("simulator.maskDrawn")}</div>
              )}
            </div>
          )}

          <div className={sim.section}>
            <div className={sim.sectionTitle}>
              {t("simulator.additionalWishes")}
              <span className={sim.sectionHint}>{t("simulator.optional")}</span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder={t("simulator.wishesPlaceholder")}
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
              {t(
                "simulator.wishesCompilerHint",
                "Пишите на любом языке и своими словами — запрос будет переведён для модели. Величины в градусах и миллиметрах она не отрабатывает: они станут «слегка», «заметно».",
              )}
            </p>
          </div>

          <label className={`${styles.checkRow} ${sim.disclaimer}`}>
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
            disabled={loading || !selectedPhoto || !hasMask || !disclaimer}
          >
            {loading ? (
              <>
                <span className={sim.spinner} />{" "}
                {t("simulator.generatingWithTime", { sec: 30 })}
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
                {activeSimId === s._id && s.promptCompiled && s.promptRaw && (
                  <details className={sim.sectionHint} style={{ padding: "6px 0" }}>
                    <summary style={{ cursor: "pointer" }}>
                      {t("simulator.promptSent", "Что было отправлено модели")}
                    </summary>
                    <p style={{ margin: "6px 0 0" }}>
                      <b>{t("simulator.promptYours", "Ваш запрос")}:</b>{" "}
                      {s.promptRaw}
                    </p>
                    <p style={{ margin: "4px 0 0", opacity: 0.85 }}>
                      <b>{t("simulator.promptModel", "Для модели")}:</b>{" "}
                      {s.prompt}
                    </p>
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
