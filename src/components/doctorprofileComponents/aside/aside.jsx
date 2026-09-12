import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import axios from "axios";
// Выход: сбросить кэш сессии и разорвать связь событий счётчика с человеком.
import { clearSession } from "../../../api/session";
import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { HiOutlineSparkles } from "react-icons/hi2";
import TrialBanner from "../../TrialBanner";
import {
  LuSquareUserRound,
  LuNewspaper,
  LuPencilLine,
  LuFlaskConical,
  LuFileText,
  LuGraduationCap,
  LuUsers,
  LuUserCheck,
  LuHospital,
  LuCalendarClock,
  LuCalendarPlus,
  LuMessagesSquare,
  LuLogOut,
  LuBuilding2,
  LuCirclePlus,
  LuStethoscope,
  LuBookMarked,
  LuLibraryBig,
  LuCalendarDays,
  LuClapperboard,
  LuMessageSquarePlus,
  LuChevronDown,
} from "react-icons/lu";
import { TbStethoscope } from "react-icons/tb";

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600&display=swap');

  .dp2 {
    --c-bg:      #0c1220;
    --c-surface: #111827;
    --c-border:  rgba(255,255,255,0.07);
    --c-accent:  #38bdf8;
    --c-teal:    #2dd4bf;
    --c-text:    #f1f5f9;
    --c-sub:     #94a3b8;
    --c-muted:   #475569;
    --c-danger:  #f87171;
    --c-hover:   rgba(56,189,248,0.08);
    --f-display: 'Playfair Display', Georgia, serif;
    --f-body:    'Outfit', system-ui, sans-serif;
    --w:         272px;
  }

  .dp2-sidebar {
    width: var(--w);
    height: 100vh;
    background: var(--c-bg) !important;
    display: flex !important;
    flex-direction: column;
    font-family: var(--f-body);
    overflow: hidden;
    border-right: 1px solid var(--c-border) !important;
  }

  .dp2-sidebar::before {
    content:'';
    position:absolute;
    top:-80px; right:-80px;
    width:280px; height:280px;
    background: radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 70%);
    pointer-events:none;
    z-index:0;
  }
  .dp2-sidebar::after {
    content:'';
    position:absolute;
    bottom:-60px; left:-60px;
    width:200px; height:200px;
    background: radial-gradient(circle, rgba(45,212,191,0.08) 0%, transparent 70%);
    pointer-events:none;
    z-index:0;
  }

  .dp2-brand {
    position: relative; z-index:1;
    padding: 22px 20px 18px;
    display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid var(--c-border);
  }
  .dp2-logo {
    width: 38px; height: 38px;
    border-radius: 11px;
    background: linear-gradient(135deg, #0ea5e9 0%, #2dd4bf 100%);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 0 3px rgba(56,189,248,0.18), 0 4px 14px rgba(56,189,248,0.28);
  }
  .dp2-logo svg { width:20px; height:20px; fill:#fff; }
  .dp2-brand-name {
    font-family: var(--f-display);
    font-size: 18px; font-weight: 600;
    color: var(--c-text); letter-spacing: 0.02em; line-height: 1;
  }
  .dp2-brand-sub {
    font-size: 9px; font-weight: 400;
    color: var(--c-muted); letter-spacing: 0.18em;
    text-transform: uppercase; margin-top: 3px;
  }

  .dp2-profile {
    position: relative; z-index:1;
    margin: 14px 12px;
    background: linear-gradient(135deg, rgba(14,165,233,0.10), rgba(45,212,191,0.08));
    border: 1px solid rgba(56,189,248,0.18);
    border-radius: 14px;
    padding: 13px 15px;
    display: flex; align-items: center; gap: 12px;
    text-decoration: none !important;
    transition: all 0.2s;
  }
  .dp2-profile:hover {
    border-color: rgba(56,189,248,0.38);
    background: linear-gradient(135deg, rgba(14,165,233,0.16), rgba(45,212,191,0.12));
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(56,189,248,0.12);
  }
  .dp2-avatar-wrap { position:relative; flex-shrink:0; }
  .dp2-avatar {
    width: 44px; height: 44px;
    border-radius: 11px; object-fit: cover;
    border: 2px solid rgba(56,189,248,0.3); display: block;
  }
  .dp2-online {
    position:absolute; bottom:-2px; right:-2px;
    width:11px; height:11px;
    background: var(--c-teal);
    border: 2px solid var(--c-bg);
    border-radius: 50%;
    box-shadow: 0 0 7px var(--c-teal);
  }
  .dp2-pinfo { flex:1; min-width:0; }
  .dp2-prole {
    font-size: 9px; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--c-accent);
    font-weight: 500; margin-bottom: 2px;
  }
  .dp2-pname {
    font-family: var(--f-display);
    font-size: 15px; font-weight: 500;
    color: var(--c-text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2;
  }
  .dp2-chevron { color: var(--c-muted); font-size: 16px; flex-shrink:0; }

  .dp2-scroll {
    flex:1; overflow-y:auto; padding: 4px 10px 16px;
    position: relative; z-index:1;
    scrollbar-width: thin; scrollbar-color: #1e2d42 transparent;
  }
  .dp2-scroll::-webkit-scrollbar { width:3px; }
  .dp2-scroll::-webkit-scrollbar-thumb { background:#1e2d42; border-radius:3px; }

  /* Заголовок раздела — теперь кнопка: разделов девять, раскрыт один.
     Плоский список из 28 пунктов заставлял читать всё меню целиком,
     чтобы найти один пункт. */
  .dp2-sec { margin-bottom: 2px; }

  /* Заголовок — карточка, а не подпись мелким шрифтом: раз он стал
     органом управления (нажал — раскрылось), он должен читаться как
     кнопка и быть заметнее пунктов внутри. Размер пунктов при этом не
     уменьшен: меню читают в том числе врачи, которым мелкий шрифт
     неудобен, поэтому заголовок выигрывает весом, цветом и фоном. */
  .dp2-gbtn {
    width: 100%;
    display: flex; align-items: center; gap: 11px;
    padding: 10px 12px;
    margin: 7px 0 3px;
    border-radius: 13px;
    background: rgba(255,255,255,0.035);
    border: 1px solid var(--c-border);
    font-family: var(--f-body);
    font-size: 16px; font-weight: 600; letter-spacing: 0.005em;
    color: var(--c-text);
    cursor: pointer; text-align: start;
    text-decoration: none !important;
    transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  .dp2-gbtn:hover {
    background: var(--c-hover);
    border-color: rgba(56,189,248,0.24);
    transform: translateY(-1px);
  }
  .dp2-gbtn[aria-expanded="true"], .dp2-gbtn.is-active {
    background: linear-gradient(135deg, rgba(14,165,233,0.17), rgba(45,212,191,0.10));
    border-color: rgba(56,189,248,0.34);
    box-shadow: 0 4px 18px rgba(56,189,248,0.10);
  }
  .dp2-gbtn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }

  .dp2-gicon {
    width: 30px; height: 30px; border-radius: 10px;
    background: rgba(255,255,255,0.06);
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; color: var(--c-sub); flex-shrink: 0;
    transition: all 0.18s ease;
  }
  .dp2-gicon svg { width: 1em; height: 1em; }
  .dp2-gbtn:hover .dp2-gicon { color: var(--c-accent); background: rgba(56,189,248,0.14); }
  .dp2-gbtn[aria-expanded="true"] .dp2-gicon, .dp2-gbtn.is-active .dp2-gicon {
    background: rgba(56,189,248,0.22);
    color: var(--c-accent);
    box-shadow: 0 0 12px rgba(56,189,248,0.25);
  }
  .dp2-glabel { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* Сколько пунктов внутри — видно, не раскрывая раздел. */
  .dp2-gcount {
    font-size: 11.5px; font-weight: 500; color: var(--c-muted);
    font-variant-numeric: tabular-nums; flex-shrink: 0;
  }
  /* Точка на свёрнутом разделе: открытая сейчас страница лежит внутри него. */
  .dp2-gdot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--c-accent); box-shadow: 0 0 7px var(--c-accent);
    flex-shrink: 0;
  }
  .dp2-gchev { font-size: 15px; color: var(--c-muted); flex-shrink: 0; transition: transform 0.18s ease; }
  .dp2-gbtn[aria-expanded="true"] .dp2-gchev { color: var(--c-accent); }
  /* Стрелка смотрит вниз у раскрытого раздела и в сторону начала строки
     у свёрнутого — поэтому в RTL поворот зеркальный. */
  .dp2-gbtn[aria-expanded="false"] .dp2-gchev { transform: rotate(-90deg); }
  [dir="rtl"] .dp2-gbtn[aria-expanded="false"] .dp2-gchev { transform: rotate(90deg); }

  /* Рубрика без вложенных пунктов — сама ссылка (чат). Бирюзовая:
     переписка с пациентом — не инструмент приёма, а отдельный канал. */
  .dp2-gbtn.is-solo { color: var(--c-teal); }
  .dp2-gbtn.is-solo .dp2-gicon { background: rgba(45,212,191,0.12); color: var(--c-teal); }
  .dp2-gbtn.is-solo:hover {
    background: rgba(45,212,191,0.08);
    border-color: rgba(45,212,191,0.26);
  }
  .dp2-gbtn.is-solo:hover .dp2-gicon { background: rgba(45,212,191,0.2); color: var(--c-teal); }
  .dp2-gbtn.is-solo.is-active {
    background: linear-gradient(135deg, rgba(45,212,191,0.18), rgba(14,165,233,0.08));
    border-color: rgba(45,212,191,0.36);
    box-shadow: 0 4px 18px rgba(45,212,191,0.10);
  }
  .dp2-gbtn.is-solo.is-active .dp2-gicon {
    background: rgba(45,212,191,0.24); color: var(--c-teal);
    box-shadow: 0 0 12px rgba(45,212,191,0.28);
  }

  /* Пункты раздела — с отступом и направляющей линией: видно, что они
     принадлежат раскрытому заголовку, а не висят сами по себе. */
  .dp2-sub {
    display: flex; flex-direction: column;
    margin: 2px 0 8px;
    margin-inline-start: 15px;
    padding-inline-start: 10px;
    border-inline-start: 1px solid var(--c-border);
    animation: dp2in 0.16s ease;
  }
  @keyframes dp2in {
    from { opacity: 0; transform: translateY(-3px); }
    to   { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .dp2-sub { animation: none; }
    .dp2-gchev, .dp2-item, .dp2-item::before { transition: none; }
  }

  .dp2-item {
    display: flex; align-items: center; gap: 11px;
    padding: 9px 12px; border-radius: 11px;
    font-size: 16.5px; font-weight: 400;
    color: var(--c-sub);
    text-decoration: none !important;
    cursor: pointer;
    transition: all 0.15s ease;
    margin-bottom: 2px;
    border: 1px solid transparent;
    position: relative; overflow: hidden;
  }
  .dp2-item::before {
    content:''; position:absolute;
    /* Логическое свойство: полоска активного пункта должна стоять
       со стороны начала строки. При left:0 на арабском она оказывалась
       с противоположной стороны от текста и читалась как чужая. */
    inset-inline-start:0; top:22%; bottom:22%;
    width:2px; background: var(--c-accent); border-radius:2px;
    transform: scaleY(0); transition: transform 0.2s ease;
  }
  .dp2-item:hover {
    background: var(--c-hover);
    color: var(--c-text);
    border-color: rgba(56,189,248,0.1);
  }
  .dp2-item:hover::before { transform: scaleY(1); }

  /* Активный пункт. Полоска слева та же, что на :hover, но остаётся на месте:
     подсветка должна отвечать на вопрос «где я», а не «куда навёл мышь». */
  .dp2-item.is-active {
    background: var(--c-hover);
    color: var(--c-text);
    border-color: rgba(56,189,248,0.22);
    font-weight: 500;
  }
  .dp2-item.is-active::before { transform: scaleY(1); }
  .dp2-item.is-active .dp2-icon {
    background: rgba(56,189,248,0.18);
    color: var(--c-accent);
    box-shadow: 0 0 10px rgba(56,189,248,0.2);
  }
  .dp2-item:hover .dp2-icon { background: rgba(56,189,248,0.14); color: var(--c-accent); box-shadow: 0 0 10px rgba(56,189,248,0.15); }

  .dp2-icon {
    width: 32px; height: 32px; border-radius: 9px;
    background: rgba(255,255,255,0.05);
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; color: var(--c-muted); flex-shrink:0;
    transition: all 0.18s ease;
  }
  .dp2-icon svg { width: 1em; height: 1em; }

  .dp2-item.is-chat .dp2-icon { background: rgba(45,212,191,0.1); color: var(--c-teal); }
  .dp2-item.is-chat { color: var(--c-teal); }
  .dp2-item.is-chat:hover { background: rgba(45,212,191,0.08); border-color: rgba(45,212,191,0.18); }
  .dp2-item.is-chat:hover .dp2-icon { background: rgba(45,212,191,0.18); box-shadow: 0 0 10px rgba(45,212,191,0.2); color: var(--c-teal); }
  .dp2-item.is-chat::before { background: var(--c-teal); }

  .dp2-item.is-logout { color: #64748b; margin-top: 4px; }
  .dp2-item.is-logout:hover { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.18); color: var(--c-danger); }
  .dp2-item.is-logout:hover .dp2-icon { background: rgba(248,113,113,0.12); color: var(--c-danger); box-shadow: none; }
  .dp2-item.is-logout::before { background: var(--c-danger); }

  .dp2-footer {
    position: relative; z-index:1;
    padding: 13px 20px 17px;
    border-top: 1px solid var(--c-border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .dp2-badge {
    display: flex; align-items: center; gap: 7px;
    font-size: 10.5px; color: var(--c-teal);
    font-weight: 500; letter-spacing: 0.03em;
  }
  .dp2-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--c-teal);
    box-shadow: 0 0 8px var(--c-teal);
    animation: dp2p 2.4s ease infinite;
  }
  @keyframes dp2p {
    0%,100% { box-shadow: 0 0 6px var(--c-teal); }
    50%      { box-shadow: 0 0 14px var(--c-teal); }
  }
  .dp2-ver { font-size: 9.5px; color: var(--c-muted); letter-spacing: 0.06em; }

  /* MODAL */
  .dp2-modal .modal-content {
    background: #111827;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 20px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
    font-family: 'Outfit', system-ui, sans-serif;
    overflow: hidden; color: #f1f5f9;
  }
  .dp2-modal .modal-header {
    background: linear-gradient(135deg, #0c1a2e, #0e2240);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 20px 28px;
  }
  .dp2-modal .modal-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px; font-weight: 500; color: #f1f5f9;
  }
  .dp2-modal .btn-close { filter: invert(1); opacity: 0.5; }
  .dp2-modal .modal-body { padding: 26px 28px; font-size: 15px; line-height: 1.7; color: #94a3b8; background: #111827; }
  .dp2-modal .modal-footer { background: #0f1624; border-top: 1px solid rgba(255,255,255,0.06); padding: 16px 28px; }
  .dp2-btn {
    background: linear-gradient(135deg, #0ea5e9, #2dd4bf);
    color: white; border: none; padding: 10px 30px; border-radius: 10px;
    font-family: 'Outfit', system-ui, sans-serif; font-size: 14px; font-weight: 500;
    cursor: pointer; transition: all 0.2s; letter-spacing: 0.02em;
    box-shadow: 0 4px 14px rgba(56,189,248,0.3);
  }
  .dp2-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(56,189,248,0.4); }
`;

export default function Aside() {
  const { t } = useTranslation();
  const isOpen = useSelector((state) => state.menu.isOpen);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState("");
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();
  const [doctorProfileFull, setDoctorProfileFull] = useState(null);
  const [profiledata, setProfiledata] = useState(
    "uploads/default/default-patient-man.png",
  );
  const location = useLocation();

  // Класс пункта меню. NavLink передаёт isActive, вычисленный по текущему
  // адресу, — сравнивать пути вручную не нужно.
  const itemClass = ({ isActive }) =>
    "dp2-item is-chat" + (isActive ? " is-active" : "");
  const popupMessage = location.state?.message || null;
  const [showModal, setShowModal] = useState(false);

  const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
  const R2_BASE = (process.env.REACT_APP_R2_PUBLIC_URL || "").replace(
    /\/+$/,
    "",
  );

  // На проде фото — полный URL (https://...) или R2-путь.
  // На локале — относительный путь, добавляем API_BASE (бэк на 11000).
  const DEFAULT_AVATAR = `${R2_BASE}/uploads/default/default-patient-man.png`;

  const getImgUrl = (path) => {
    if (!path) return DEFAULT_AVATAR;
    // Уже полный URL — отдаём как есть (CDN, R2)
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const clean = path.startsWith("/") ? path.slice(1) : path;
    // Дефолтные картинки — берём с R2 (они там точно есть)
    if (clean.startsWith("uploads/default/")) return `${R2_BASE}/${clean}`;
    // Аватары пользователей — берём с бэка (локально на диске сервера)
    return `${API_BASE}/${clean}`;
  };

  useEffect(() => {
    if (popupMessage) setShowModal(true);
  }, [popupMessage]);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);
          setUserId(response.data.user.userId);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      }
    };
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/get-profile-doctor/${userId}`,
          { withCredentials: true },
        );
        setDoctorProfileFull(response.data.profile || null);
        const rawImg =
          response.data.profile?.profileImage || "uploads/default.png";
        setProfiledata(rawImg);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true },
      );
      clearSession();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Разделы меню собраны по тому, ЧТО ДЕЛАЕТ ВРАЧ, а не по тому, каким
  // модулем это реализовано. Сверху ежедневный приём, ниже — то, к чему
  // обращаются реже; аккаунт и выход в самом низу. Раньше тринадцать
  // разнородных пунктов — от ИИ-консультации до тарифов и обратной связи —
  // лежали под одним заголовком «AI-Дайджест», а приём пациента, главное
  // ежедневное действие, был в конце списка.
  const NAV = React.useMemo(
    () => [
      {
        id: "work",
        label: t("doctorNav.work", { defaultValue: "Приём" }),
        icon: <LuCalendarClock />,
        items: [
          {
            to: "/doctor/doctor-dashboard-main",
            icon: <LuCalendarClock />,
            label: t("appointments_dashboard"),
          },
          {
            to: "/doctor/book-patient",
            icon: <LuCalendarPlus />,
            label: t("book_patient_menu", { defaultValue: "Записать на приём" }),
          },
          {
            // Операция и обследование — отдельная сущность, а не режим
            // записи на приём: другая длительность и подготовка.
            to: "/doctor/book-procedure",
            icon: <LuCalendarPlus />,
            label: t("book_procedure_menu", {
              defaultValue: "Записать на операцию",
            }),
          },
          {
            to: "/doctor/procedures",
            icon: <LuCalendarClock />,
            label: t("procedures_journal_menu", {
              defaultValue: "Журнал вмешательств",
            }),
          },
        ],
      },
      {
        // Чат — рубрика сама по себе, без вложенных пунктов: переписка с
        // пациентами и коллегами это отдельный канал связи, а не один из
        // инструментов приёма. Заголовок здесь и есть ссылка.
        id: "chat",
        solo: true,
        label: t("chat"),
        icon: <LuMessagesSquare />,
        items: [{ to: "/doctor/communication" }],
      },
      {
        // Инструменты решения у постели больного: сюда приходят с вопросом
        // по КОНКРЕТНОМУ пациенту. Тренажёр диагностики намеренно не здесь,
        // а в «Обучении» — разбор своего пациента нельзя путать с учебным.
        id: "support",
        label: t("doctorNav.support", { defaultValue: "Помощь в решении" }),
        icon: <LuStethoscope />,
        items: [
          {
            to: "/doctor/consultation-ai",
            icon: <TbStethoscope />,
            label: t("ai_medical_consultation"),
          },
          {
            to: "/diagnostics",
            icon: <LuStethoscope />,
            label: t("diagnostics_second_opinion", {
              defaultValue: "Второе мнение",
            }),
          },
          {
            to: "/doctor/evidence",
            icon: <LuLibraryBig />,
            label: t("evidence_based", {
              defaultValue: "Доказательная медицина",
            }),
          },
          {
            to: "/doctor/medical-codes",
            icon: <LuBookMarked />,
            label: t("medical_codes", { defaultValue: "Справочник кодов" }),
          },
        ],
      },
      {
        // Видео — отдельная рубрика, а не функция приёма: студия DP-Videra
        // плюс два хранилища роликов (свои и общая витрина платформы) это
        // самостоятельный видеосервис со своими правами и публикацией.
        id: "video",
        label: t("doctorNav.video", { defaultValue: "Видео" }),
        icon: <LuClapperboard />,
        items: [
          {
            to: "/doctor/videra",
            icon: <LuClapperboard />,
            label: t("videra.menu", { defaultValue: "Снять фильм" }),
          },
          {
            to: "/doctor/videos",
            icon: <LuLibraryBig />,
            label: t("videra.library.menu", { defaultValue: "Мои ролики" }),
          },
          {
            to: "/videos",
            icon: <LuLibraryBig />,
            label: t("videra.gallery.menu", {
              defaultValue: "Медицинские ролики",
            }),
          },
        ],
      },
      {
        id: "knowledge",
        label: t("doctorNav.knowledge", { defaultValue: "Знания и новости" }),
        icon: <LuNewspaper />,
        items: [
          {
            to: "/doctor/news",
            icon: <LuNewspaper />,
            label: t("medical_feed"),
          },
          {
            to: "/public/user-synthesis",
            icon: <HiOutlineSparkles />,
            label: t("aiSynthesis"),
            external: true,
          },
          {
            // Страница публичная (её же открывают ссылки из писем),
            // поэтому адрес без префикса /doctor.
            to: "/conferences",
            icon: <LuCalendarDays />,
            label: t("conferences_menu", { defaultValue: "Конференции" }),
          },
        ],
      },
      {
        id: "education",
        label: t("education", { defaultValue: "Обучение" }),
        icon: <LuGraduationCap />,
        items: [
          {
            to: "/education",
            icon: <LuGraduationCap />,
            label: t("education_prep", {
              defaultValue: "Подготовка к экзаменам",
            }),
          },
          {
            to: "/arena",
            icon: "🎯",
            label: t("arena_trainer", { defaultValue: "Тренажёр диагностики" }),
          },
        ],
      },
      {
        // Обычные и научные статьи объединены: это одно занятие — писать
        // и вести свои публикации, а два раздела по два пункта только
        // удлиняли меню.
        id: "publications",
        label: t("doctorNav.publications", { defaultValue: "Публикации" }),
        icon: <LuPencilLine />,
        items: [
          {
            to: "/doctor/create-my-articles",
            icon: <LuPencilLine />,
            label: t("create_article"),
          },
          {
            to: "/doctor/my-articles",
            icon: <LuFileText />,
            label: t("my_articles"),
          },
          {
            to: "/doctor/create-my-articles-scientific",
            icon: <LuFlaskConical />,
            label: t("create_scientific_article"),
          },
          {
            to: "/doctor/my-articles-scientific",
            icon: <LuGraduationCap />,
            label: t("my_scientific_articles"),
          },
        ],
      },
      {
        id: "colleagues",
        label: t("colleagues", { defaultValue: "Коллеги" }),
        icon: <LuUsers />,
        items: [
          {
            to: "/doctor/all-doctors",
            icon: <LuUsers />,
            label: t("colleagues"),
          },
          {
            to: "/doctor/my-friends-doctors",
            icon: <LuUserCheck />,
            label: t("my_friends_colleagues"),
          },
        ],
      },
      {
        id: "clinic",
        label: t("doctorNav.clinic", { defaultValue: "Клиника" }),
        icon: <LuHospital />,
        items: [
          {
            to: "/dp/polyclinic",
            icon: <LuHospital />,
            label: t("my_clinic"),
          },
          {
            to: "/doctor/my-clinics",
            icon: <LuBuilding2 />,
            label: t("my_clinics", { defaultValue: "Мои клиники" }),
          },
          {
            to: "/clinic",
            icon: <LuCirclePlus />,
            label: t("create_clinic", { defaultValue: "Создать клинику" }),
          },
        ],
      },
      {
        // Всё про самого врача и его подписку — в одном месте внизу.
        // «Тарифы», «Пригласить» и «Обратная связь» лежали среди
        // клинических инструментов и мешали их читать.
        id: "account",
        label: t("doctorNav.account", { defaultValue: "Аккаунт" }),
        icon: <LuSquareUserRound />,
        items: [
          {
            to: `/doctor/doctor-profile/${userId}`,
            match: "/doctor/doctor-profile",
            icon: <LuSquareUserRound />,
            label: t("profile"),
          },
          {
            to: "/pricing?tab=doctors",
            icon: <LuCirclePlus />,
            label: t("doctorAside.pricing", { defaultValue: "Тарифы" }),
          },
          {
            to: "/doctor/invite",
            icon: "🎁",
            label: t("referral.nav", { defaultValue: "Пригласить (+бонус)" }),
          },
          {
            // Врач замечает недостающее раньше всех — путь «написать нам»
            // должен быть в меню, а не в подвале страницы помощи.
            to: "/doctor/feedback",
            icon: <LuMessageSquarePlus />,
            label: t("feedback.menu", { defaultValue: "Обратная связь" }),
          },
        ],
      },
    ],
    [t, userId],
  );

  // Раздел, внутри которого лежит открытая страница. По нему меню
  // раскрывается само — после перезагрузки и после перехода по ссылке
  // врач видит, где он находится, а не пустые заголовки.
  // Рубрики-ссылки (чат) в расчёте не участвуют: у них нечего раскрывать,
  // и переход в чат не должен схлопывать раздел, в котором врач работал.
  const activeGroupId = React.useMemo(() => {
    const hit = NAV.filter((group) => !group.solo).find((group) =>
      group.items.some((item) => {
        const base = item.match || item.to.split("?")[0];
        return (
          location.pathname === base || location.pathname.startsWith(base + "/")
        );
      }),
    );
    return hit ? hit.id : null;
  }, [NAV, location.pathname]);

  const [openGroup, setOpenGroup] = useState(() => {
    try {
      return localStorage.getItem("dp2:navGroup") || "work";
    } catch (e) {
      return "work";
    }
  });

  useEffect(() => {
    if (activeGroupId) setOpenGroup(activeGroupId);
  }, [activeGroupId]);

  const toggleGroup = (id) => {
    setOpenGroup((current) => {
      const next = current === id ? null : id;
      try {
        if (next) localStorage.setItem("dp2:navGroup", next);
      } catch (e) {
        /* приватный режим браузера — состояние просто не переживёт перезагрузку */
      }
      return next;
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="dp2">
      <style>{S}</style>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        className="dp2-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t("attention")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: "16px", marginBottom: 0 }}>{popupMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <button className="dp2-btn" onClick={() => setShowModal(false)}>
            {t("understood")}
          </button>
        </Modal.Footer>
      </Modal>

      <aside
        id={isOpen ? "sidebar-hidden open" : "sidebar-hidden"}
        className={`dp2-sidebar ${isOpen ? "sidebar open" : "sidebar"}`}
      >
        <div className="dp2-brand">
          <div className="dp2-logo">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6H9l3-5 3 5h-2v6z" />
            </svg>
          </div>
          <div>
            <div className="dp2-brand-name">DocPats</div>
            <div className="dp2-brand-sub">{t("brand.medicalPlatform")}</div>
          </div>
        </div>

        <Link className="dp2-profile" to={`/doctor/doctor-profile/${userId}`}>
          <div className="dp2-avatar-wrap">
            <img
              src={getImgUrl(profiledata)}
              alt={t("header.profile")}
              className="dp2-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_AVATAR;
              }}
            />
            <span className="dp2-online" />
          </div>
          <div className="dp2-pinfo">
            <div className="dp2-prole">{t("office_of")}</div>
            <div className="dp2-pname">Dr. {user.firstName}</div>
          </div>
          <span className="dp2-chevron">›</span>
        </Link>
        <TrialBanner />
        <div className="dp2-scroll">
          {NAV.map((group) => {
            const open = openGroup === group.id;
            const hasActive = group.id === activeGroupId;

            // Рубрика-ссылка: раскрывать нечего, заголовок ведёт на страницу.
            if (group.solo) {
              return (
                <NavLink
                  key={group.id}
                  to={group.items[0].to}
                  className={({ isActive }) =>
                    "dp2-gbtn is-solo" + (isActive ? " is-active" : "")
                  }
                >
                  <span className="dp2-gicon">{group.icon}</span>
                  <span className="dp2-glabel">{group.label}</span>
                </NavLink>
              );
            }

            return (
              <div className="dp2-sec" key={group.id}>
                <button
                  type="button"
                  className={"dp2-gbtn" + (hasActive ? " has-active" : "")}
                  aria-expanded={open}
                  aria-controls={`dp2-sub-${group.id}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <span className="dp2-gicon">{group.icon}</span>
                  <span className="dp2-glabel">{group.label}</span>
                  {!open && hasActive ? <span className="dp2-gdot" /> : null}
                  {!open ? (
                    <span className="dp2-gcount">{group.items.length}</span>
                  ) : null}
                  <LuChevronDown className="dp2-gchev" />
                </button>

                {open ? (
                  <div className="dp2-sub" id={`dp2-sub-${group.id}`}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        className={itemClass}
                        to={item.to}
                        {...(item.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : null)}
                      >
                        <span className="dp2-icon">{item.icon}</span>
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="dp2-item is-logout" onClick={handleLogout}>
            <span className="dp2-icon">
              <LuLogOut />
            </span>
            {t("logout")}
          </div>
        </div>

        <div className="dp2-footer">
          <span className="dp2-badge">
            <span className="dp2-dot" />
            {t("brand.hipaaCompliant")}
          </span>
          <span className="dp2-ver">v2.1.0</span>
        </div>
      </aside>
    </div>
  );
}
