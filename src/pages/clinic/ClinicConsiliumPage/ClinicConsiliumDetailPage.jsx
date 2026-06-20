// client/src/pages/clinic/ClinicConsiliumPage/ClinicConsiliumDetailPage.jsx

import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Link,
  useParams,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getConsilium,
  updateConsilium,
  archiveConsilium,
  listConsiliumMessages,
  postConsiliumMessage,
  listDepartments,
  listStaff,
} from "../../../api/clinic";
import ResolveConsiliumModal from "./ResolveConsiliumModal";
import JitsiRoom from "../../communication/components/JitsiRoom";
import "./clinicConsiliumPage.css";

export default function ClinicConsiliumDetailPage() {
  const { t, i18n } = useTranslation("clinic");
  const { id } = useParams();
  const navigate = useNavigate();
  const layoutContext = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [consilium, setConsilium] = useState(null);
  const [messages, setMessages] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staff, setStaff] = useState([]);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  // Видеоконференция консилиума (Jitsi, групповая)
  const [showVideo, setShowVideo] = useState(false);

  const threadEndRef = useRef(null);

  const myRole = layoutContext?.role || "member";
  const canManage = ["owner", "admin", "manager", "doctor"].includes(myRole);

  // Имя текущего пользователя для подписи в видеокомнате (если доступно).
  const myDisplayName =
    layoutContext?.displayName ||
    [layoutContext?.user?.firstName, layoutContext?.user?.lastName]
      .filter(Boolean)
      .join(" ") ||
    layoutContext?.user?.name ||
    undefined;

  // membershipId → display name, for attributing messages/participants.
  const staffByMembership = useMemo(() => {
    const m = {};
    for (const s of staff) {
      const mid = String(s.membershipId || s._id || s.id);
      m[mid] =
        [s.firstName, s.lastName].filter(Boolean).join(" ") ||
        s.email ||
        s.username ||
        "—";
    }
    return m;
  }, [staff]);

  // userId → display name, for attributing messages by createdBy.
  const staffByUser = useMemo(() => {
    const m = {};
    for (const s of staff) {
      const uid = String(s.userId || s.user?._id || "");
      if (uid)
        m[uid] =
          [s.firstName, s.lastName].filter(Boolean).join(" ") ||
          s.email ||
          s.username ||
          "—";
    }
    return m;
  }, [staff]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [cRes, mRes, deptsRes, staffRes] = await Promise.all([
        getConsilium(id),
        listConsiliumMessages(id).catch(() => ({ items: [] })),
        listDepartments({}).catch(() => ({ items: [] })),
        listStaff().catch(() => ({ items: [] })),
      ]);
      setConsilium(cRes.consilium || null);
      setMessages(mRes.items || []);
      setDepartments(deptsRes.items || []);
      setStaff(staffRes.items || []);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(
        err.response?.status === 404
          ? t("consilium.notFound", { defaultValue: "Консилиум не найден" })
          : err.message || "Failed to load consilium",
      );
      setLoading(false);
    }
  }, [id, navigate, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const deptName =
    consilium?.departmentId &&
    departments.find((d) => String(d._id) === String(consilium.departmentId))
      ?.name;

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await postConsiliumMessage(id, text);
      setMessages((prev) => [...prev, res.message]);
      setDraft("");
      // reflect counter locally
      setConsilium((c) =>
        c ? { ...c, messageCount: (c.messageCount || 0) + 1 } : c,
      );
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("consilium.sendFailed", { defaultValue: "Не удалось отправить" }),
      );
    } finally {
      setSending(false);
    }
  }

  async function handleResolve(conclusion) {
    setBusy(true);
    try {
      const res = await updateConsilium(id, {
        status: "resolved",
        conclusion,
      });
      setConsilium(res.consilium);
      setResolveOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleReopen() {
    setBusy(true);
    try {
      const res = await updateConsilium(id, { status: "open" });
      setConsilium(res.consilium);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  }

  // Пустить/убрать пациента из видеокомнаты консилиума (gate C).
  // По умолчанию консилиум закрыт для пациента — врачи совещаются приватно,
  // затем одной галочкой впускают пациента в живую видеокомнату.
  async function handleTogglePatientJoin() {
    if (!consilium) return;
    const next = !consilium.patientCanJoin;
    setBusy(true);
    try {
      const res = await updateConsilium(id, { patientCanJoin: next });
      setConsilium(res.consilium);
    } catch (err) {
      alert(
        err.response?.data?.error ||
          t("consilium.patientJoinFailed", {
            defaultValue: "Не удалось изменить доступ пациента",
          }),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive() {
    if (
      !window.confirm(
        t("consilium.confirmArchive", {
          name: consilium?.title,
          defaultValue: `Архивировать «${consilium?.title}»?`,
        }),
      )
    )
      return;
    setBusy(true);
    try {
      await archiveConsilium(id);
      navigate("/clinic/consilia");
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
      setBusy(false);
    }
  }

  const fmtDateTime = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString(i18n.language || undefined);
    } catch {
      return "";
    }
  };

  function authorName(msg) {
    if (
      msg.authorMembershipId &&
      staffByMembership[String(msg.authorMembershipId)]
    )
      return staffByMembership[String(msg.authorMembershipId)];
    if (msg.createdBy && staffByUser[String(msg.createdBy)])
      return staffByUser[String(msg.createdBy)];
    return t("consilium.unknownAuthor", { defaultValue: "Участник" });
  }

  if (loading) {
    return (
      <div className="cons-page-loading">
        <div className="cons-page-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="cons-page-error">
        <h2>{t("consilium.errorTitle", { defaultValue: "Ошибка" })}</h2>
        <p>{error}</p>
        <Link to="/clinic/consilia" className="cons-page-btn-primary">
          {t("consilium.back", { defaultValue: "← Консилиумы" })}
        </Link>
      </div>
    );
  }

  if (!consilium) return null;

  const archived = consilium.status === "archived";
  const resolved = consilium.status === "resolved";
  const hasPatient = Boolean(consilium.patientId);
  const patientInvited = Boolean(consilium.patientCanJoin);

  return (
    <div className="cons-detail">
      <div className="cons-detail-topbar">
        <Link to="/clinic/consilia" className="cons-page-back">
          {t("consilium.backToList", { defaultValue: "← К списку" })}
        </Link>
        {canManage && (
          <div className="cons-detail-actions">
            {/* Видеоконференция (Jitsi, групповая) — недоступна в архиве */}
            {!archived && (
              <button
                className="cons-detail-btn"
                onClick={() => setShowVideo(true)}
                type="button"
              >
                🎥{" "}
                {t("consilium.videoCall", {
                  defaultValue: "Видеоконференция",
                })}
              </button>
            )}
            {/* Пустить пациента в видеокомнату (gate C). Только если у
                консилиума есть пациент — иначе впускать некого. */}
            {!archived && hasPatient && (
              <button
                className="cons-detail-btn"
                onClick={handleTogglePatientJoin}
                disabled={busy}
                type="button"
                title={t("consilium.patientJoinHint", {
                  defaultValue:
                    "Разрешить пациенту входить в видеокомнату консилиума",
                })}
                style={
                  patientInvited
                    ? { borderColor: "#059669", color: "#059669" }
                    : undefined
                }
              >
                {patientInvited
                  ? t("consilium.patientJoinOn", {
                      defaultValue: "✓ Пациент допущен в видео",
                    })
                  : t("consilium.patientJoinOff", {
                      defaultValue: "Пустить пациента в видео",
                    })}
              </button>
            )}
            {!archived && !resolved && (
              <button
                className="cons-detail-btn"
                onClick={() => setResolveOpen(true)}
                disabled={busy}
                type="button"
              >
                {t("consilium.resolve", { defaultValue: "Завершить" })}
              </button>
            )}
            {resolved && (
              <button
                className="cons-detail-btn"
                onClick={handleReopen}
                disabled={busy}
                type="button"
              >
                {t("consilium.reopen", { defaultValue: "Возобновить" })}
              </button>
            )}
            <button
              className="cons-detail-btn is-danger"
              onClick={handleArchive}
              disabled={busy || archived}
              type="button"
            >
              {t("consilium.archive", { defaultValue: "В архив" })}
            </button>
          </div>
        )}
      </div>

      <header className="cons-detail-header">
        <div className="cons-detail-badges">
          <span className={`cons-status-badge status-${consilium.status}`}>
            {t(`consilium.status.${consilium.status}`, {
              defaultValue: consilium.status,
            })}
          </span>
          {deptName && <span className="cons-detail-dept">🏥 {deptName}</span>}
          {hasPatient && patientInvited && (
            <span className="cons-detail-dept" style={{ color: "#059669" }}>
              👤{" "}
              {t("consilium.patientInvited", {
                defaultValue: "Пациент приглашён в видео",
              })}
            </span>
          )}
        </div>
        <h1 className="cons-detail-title">{consilium.title}</h1>
        {consilium.description && (
          <p className="cons-detail-desc">{consilium.description}</p>
        )}
      </header>

      {resolved && consilium.conclusion && (
        <div className="cons-conclusion">
          <div className="cons-conclusion-label">
            {t("consilium.conclusion", { defaultValue: "Заключение" })}
          </div>
          <div className="cons-conclusion-text">{consilium.conclusion}</div>
        </div>
      )}

      {/* Thread */}
      <section className="cons-thread">
        <h2>
          {t("consilium.discussion", { defaultValue: "Обсуждение" })}
          <span className="cons-page-count">{messages.length}</span>
        </h2>

        {messages.length === 0 ? (
          <div className="cons-thread-empty">
            {t("consilium.noMessages", {
              defaultValue: "Пока нет сообщений. Начните обсуждение.",
            })}
          </div>
        ) : (
          <div className="cons-thread-list">
            {messages.map((m) => (
              <div className="cons-msg" key={m._id || m.id}>
                <div className="cons-msg-head">
                  <span className="cons-msg-author">{authorName(m)}</span>
                  <span className="cons-msg-time">
                    {fmtDateTime(m.createdAt)}
                  </span>
                </div>
                <div className="cons-msg-text">{m.text}</div>
              </div>
            ))}
            <div ref={threadEndRef} />
          </div>
        )}

        {/* Composer */}
        {canManage && !archived && (
          <div className="cons-composer">
            <textarea
              className="cons-composer-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("consilium.composerPlaceholder", {
                defaultValue: "Ваше мнение по случаю…",
              })}
              rows={3}
              disabled={sending}
              maxLength={20000}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend();
              }}
            />
            <div className="cons-composer-actions">
              <span className="cons-composer-hint">
                {t("consilium.composerHint", {
                  defaultValue: "Ctrl/⌘ + Enter — отправить",
                })}
              </span>
              <button
                className="cons-page-btn-primary"
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                type="button"
              >
                {sending
                  ? t("common.saving", { defaultValue: "Отправка…" })
                  : t("consilium.send", { defaultValue: "Отправить" })}
              </button>
            </div>
          </div>
        )}
        {archived && (
          <div className="cons-thread-empty">
            {t("consilium.archivedNotice", {
              defaultValue: "Консилиум в архиве — новые сообщения недоступны.",
            })}
          </div>
        )}
      </section>

      {/* Видеоконференция (оверлей) */}
      {showVideo && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVideo(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 6000,
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 960,
              height: "80vh",
              maxHeight: 720,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            <JitsiRoom
              source="consilium"
              id={id}
              displayName={myDisplayName}
              onClose={() => setShowVideo(false)}
            />
          </div>
        </div>
      )}

      {resolveOpen && (
        <ResolveConsiliumModal
          onClose={() => setResolveOpen(false)}
          onSubmit={handleResolve}
        />
      )}
    </div>
  );
}
