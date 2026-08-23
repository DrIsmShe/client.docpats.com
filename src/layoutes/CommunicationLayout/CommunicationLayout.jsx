// Замени этот файл на свой CommunicationLayout.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useParams, useLocation } from "react-router-dom";
import DialogList from "../../pages/communication/components/DialogList";
import NewGroupModal from "../../pages/communication/components/NewGroupModal";
import { useDialogs } from "../../pages/communication/hooks/useDialogs";
import { useCurrentUser } from "../../pages/communication/hooks/useCurrentUser";

const MOBILE_BP = 650;

// У десктопного сайдбара своих стилей в проекте не было — классы стояли
// голыми. Добавляем ровно то, что нужно кнопке: шапка становится строкой,
// чтобы «+ Группа» встала справа от заголовка. Остальную вёрстку не трогаем.
const desktopStyles = `
  .communication-sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .comm-new-group {
    flex-shrink: 0;
    border: 1px solid #d3e0dd;
    background: #fff;
    border-radius: 8px;
    padding: 5px 11px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #0d6b5e;
    cursor: pointer;
    white-space: nowrap;
  }
  .comm-new-group:hover {
    background: #0d6b5e;
    border-color: #0d6b5e;
    color: #fff;
  }
`;

const mobileStyles = `
  .mobile-comm-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #ffffff;
    overflow: hidden;
  }

  .mobile-comm-topbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    background: linear-gradient(135deg, #1a6b8a 0%, #0f4c6b 100%);
    flex-shrink: 0;
  }

  .mobile-comm-icon {
    font-size: 22px;
    opacity: 0.9;
    line-height: 1;
  }

  .mobile-comm-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    flex: 1;
    letter-spacing: 0.01em;
  }

  .mobile-comm-count {
    font-size: 12px;
    color: rgba(255,255,255,0.65);
    background: rgba(255,255,255,0.12);
    padding: 3px 10px;
    border-radius: 12px;
    font-weight: 600;
    font-family: 'Nunito', sans-serif;
  }

  .mobile-comm-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .mobile-comm-chat {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .comm-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #94a3b8;
    font-family: 'Nunito', sans-serif;
  }
`;

export default function CommunicationLayout() {
  const { t } = useTranslation("Communication");
  const { dialogId } = useParams();
  const { dialogs, loading, setActiveDialog, setCurrentUser } = useDialogs();
  const { user } = useCurrentUser();

  // Передаём userId в useDialogs (нужно для корректного счётчика непрочитанных)
  useEffect(() => {
    if (user) setCurrentUser(user.id || user._id);
  }, [user]);

  useEffect(() => {
    setActiveDialog(dialogId || null);
  }, [dialogId]);
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const basePath = location.pathname.startsWith("/doctor")
    ? "/doctor/communication"
    : "/patient/communication";

  // Групповой диалог = комната конференции: разговор втроём и больше
  // возможен только там, где пропуск в Jitsi получает каждый участник.
  const [groupOpen, setGroupOpen] = useState(false);

  // ── MOBILE: нет открытого диалога → только список ────────────────────────
  if (isMobile && !dialogId) {
    return (
      <>
        <style>{mobileStyles}</style>
        <div className="mobile-comm-page">
          <div className="mobile-comm-topbar">
            <span className="mobile-comm-icon">💬</span>
            <span className="mobile-comm-title">{t("ui.messages")}</span>
            {!loading && dialogs.length > 0 && (
              <span className="mobile-comm-count">{dialogs.length}</span>
            )}
          </div>
          <div className="mobile-comm-list">
            {loading ? (
              <div className="comm-loading">{t("ui.loading")}</div>
            ) : (
              <DialogList
                dialogs={dialogs}
                activeDialogId={null}
                basePath={basePath}
              />
            )}
          </div>
        </div>
      </>
    );
  }

  // ── MOBILE: диалог открыт → только ChatWindow на весь экран ─────────────
  if (isMobile && dialogId) {
    return (
      <>
        <style>{mobileStyles}</style>
        <div className="mobile-comm-chat">
          <Outlet
            context={{ dialogs, loading, setActiveDialog, setCurrentUser }}
          />
        </div>
      </>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────────────────
  return (
    <div className="communication-layout">
      <style>{desktopStyles}</style>
      <div className="communication-sidebar">
        <div className="communication-sidebar-header">
          <span style={{ marginInlineEnd: "auto" }}>{t("ui.messagesIcon")}</span>
          <button
            type="button"
            className="comm-new-group"
            onClick={() => setGroupOpen(true)}
            title={t("ui.newGroupTitle")}
          >
            {t("ui.newGroup")}
          </button>
        </div>
        <div className="communication-dialogs">
          {loading ? (
            <div style={{ padding: 20 }}>{t("ui.loading")}</div>
          ) : (
            <DialogList
              dialogs={dialogs}
              activeDialogId={dialogId}
              basePath={basePath}
            />
          )}
        </div>
      </div>

      <div className="communication-chat">
        <Outlet
          context={{ dialogs, loading, setActiveDialog, setCurrentUser }}
        />
      </div>

      {groupOpen && (
        <NewGroupModal
          dialogs={dialogs}
          basePath={basePath}
          onClose={() => setGroupOpen(false)}
        />
      )}
    </div>
  );
}
