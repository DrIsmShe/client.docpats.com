// client/src/pages/ChatPage.jsx

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import ChatWindow from "../communication/components/ChatWindow";
import DialogList from "../communication/components/DialogList";
import { useOutletContext } from "react-router-dom";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { useCallContext } from "../communication/context/GlobalCallProvider";
// Брейкпоинт по ширине окна с учётом sidebar'а (~250px)
// iPad Mini 768px → с sidebar = 768px (полноэкранный режим без sidebar на мобильном)
// Ставим 900 чтобы планшеты тоже получали мобильный вид
const MOBILE_BP = 900;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');

  .chatpage-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background: #f6f8fa;
  }
  .chatpage-empty-box {
    text-align: center;
    padding: 52px 44px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    max-width: 360px;
    width: 100%;
    border: 1px solid #eaecf0;
  }
  .chatpage-empty-icon {
    font-size: 52px;
    margin-bottom: 16px;
    display: block;
    animation: floatIcon 3s ease-in-out infinite;
  }
  @keyframes floatIcon {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .chatpage-empty-title {
    font-family: "Inter", "Nunito", sans-serif;
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  .chatpage-empty-subtitle {
    font-size: 13.5px;
    color: #6b7280;
    line-height: 1.6;
    max-width: 240px;
    margin: 0 auto;
  }

  .chatpage-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
    font-size: 14px;
    gap: 10px;
    background: #f6f8fa;
  }
  .chatpage-loading::before {
    content: '';
    width: 18px; height: 18px;
    border: 2px solid #2563eb;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
    flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── МОБИЛЬНЫЙ ВИД ── */
  .mobile-page {
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: #f6f8fa;
    overflow: hidden;
  }

  .mobile-topbar {
    background: #ffffff;
    border-bottom: 1px solid #eaecf0;
    flex-shrink: 0;
    padding-top: env(safe-area-inset-top, 0px);
  }
  .mobile-topbar-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
  }
  .mobile-topbar-title {
    font-family: "Inter", sans-serif;
    font-size: 17px;
    font-weight: 600;
    color: #111827;
    flex: 1;
  }
  .mobile-topbar-count {
    font-size: 12px;
    font-weight: 600;
    color: #2563eb;
    background: #eff6ff;
    padding: 2px 9px;
    border-radius: 999px;
  }
  .mobile-list-body {
    flex: 1;
    overflow-y: auto;
    background: #ffffff;
    -webkit-overflow-scrolling: touch;
  }
`;

function ChatPage() {
  const { dialogId } = useParams();
  const navigate = useNavigate();

  const { user, loading: userLoading } = useCurrentUser();
  const {
    dialogs = [],
    loading = false,
    setActiveDialog,
    setCurrentUser,
  } = useOutletContext() || {};

  const call = useCallContext();

  // ── Определение мобильного режима ────────────────────────────────────────
  // Используем window.innerWidth — простое и надёжное решение.
  // MOBILE_BP = 900 покрывает iPad Mini (768px) и другие планшеты.
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BP);
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  useEffect(() => {
    if (user) setCurrentUser(user.id || user._id);
  }, [user]);

  useEffect(() => {
    setActiveDialog(dialogId || null);
  }, [dialogId]);

  const activeDialog = useMemo(() => {
    if (!dialogs || !dialogId) return null;
    return dialogs.find((d) => String(d._id) === String(dialogId)) || null;
  }, [dialogs, dialogId]);

  const handleShareMessage = (targetDialogId, message) => {
    const roleFromUser =
      user?.role === "patient"
        ? "patient"
        : user?.role === "doctor"
          ? "doctor"
          : null;
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const roleFromPath = ["doctor", "patient"].includes(pathSegments[0])
      ? pathSegments[0]
      : null;
    const roleSegment = roleFromUser || roleFromPath || "doctor";
    navigate(`/${roleSegment}/communication/${targetDialogId}`, {
      state: { forwardedMessage: message },
    });
  };

  const chatWindowProps = {
    dialogId,
    currentUser: user,
    dialogs,
    peerUser: activeDialog?.peerUser,
    // Мобильный вид рисует ChatWindow ещё до загрузки списка диалогов,
    // поэтому там undefined значит «грузится», а не «группа».
    dialogType: activeDialog?.type,
    dialogTitle: activeDialog?.displayName,
    dialogAvatar: activeDialog?.avatarUrl,
    onShareMessage: handleShareMessage,
    onInitiateCall: call?.initiateCall,
  };

  // ── МОБИЛЬНЫЙ / ПЛАНШЕТНЫЙ ВИД (< 900px) ─────────────────────────────────
  if (isMobile) {
    // Нет активного диалога — показываем список
    if (!dialogId) {
      return (
        <div className="mobile-page">
          <style>{styles}</style>
          <div className="mobile-topbar">
            <div className="mobile-topbar-inner">
              <span style={{ fontSize: 20 }}>💬</span>
              <span className="mobile-topbar-title">Messages</span>
              {!loading && dialogs.length > 0 && (
                <span className="mobile-topbar-count">{dialogs.length}</span>
              )}
            </div>
          </div>
          <div className="mobile-list-body">
            {loading ? (
              <div className="chatpage-loading">Loading</div>
            ) : (
              <DialogList dialogs={dialogs} activeDialogId={null} />
            )}
          </div>
        </div>
      );
    }

    // Открытый диалог — полноэкранный чат
    return (
      <div className="mobile-page">
        <style>{styles}</style>
        {userLoading ? (
          <div className="chatpage-loading">Loading…</div>
        ) : !user ? (
          <div className="chatpage-loading" style={{ color: "#ef4444" }}>
            Not authorized
          </div>
        ) : (
          <ChatWindow {...chatWindowProps} />
        )}
      </div>
    );
  }

  // ── ДЕСКТОПНЫЙ ВИД (≥ 900px) ─────────────────────────────────────────────
  return (
    <>
      <style>{styles}</style>;
      {userLoading ? (
        <div className="chatpage-loading">Loading…</div>
      ) : !user ? (
        <div className="chatpage-loading" style={{ color: "#ef4444" }}>
          Not authorized
        </div>
      ) : activeDialog ? (
        <ChatWindow {...chatWindowProps} />
      ) : (
        <div className="chatpage-empty">
          <div className="chatpage-empty-box">
            <span className="chatpage-empty-icon">🩺</span>
            <div className="chatpage-empty-title">Select a dialog</div>
            <div className="chatpage-empty-subtitle">
              Choose a patient or colleague from the list on the left
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatPage;
