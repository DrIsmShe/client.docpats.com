import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import OnboardingChecklist from "../../../components/shared/OnboardingChecklist";
import PhoneInput from "react-phone-input-2";
import { useTranslation } from "react-i18next";

/* ═══════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════ */
const S = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --ink:      #0b1120;
  --ink2:     #1a2540;
  --slate:    #2d3a55;
  --muted:    #6b7899;
  --sub:      #a0aabd;
  --gold:     #c4953a;
  --gold2:    #ddb96e;
  --teal:     #0d9488;
  --teal2:    #14b8a6;
  --danger:   #dc2626;
  --success:  #059669;
  --bg:       #f5f6f8;
  --surface:  #ffffff;
  --border:   rgba(11,17,32,.08);
  --border2:  rgba(11,17,32,.05);
  --f-display:'Cormorant Garamond', Georgia, serif;
  --f-body:   'DM Sans', system-ui, sans-serif;
  --f-mono:   'JetBrains Mono', monospace;
  --r:        16px;
  --r-sm:     10px;
  --shadow:   0 1px 20px rgba(11,17,32,.07);
  --shadow2:  0 8px 48px rgba(11,17,32,.14);
}

.pp { font-family: var(--f-body); color: var(--ink); background: var(--bg); min-height: 100vh; }

/* ── MODAL ── */
.pp-modal-backdrop {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(11,17,32,.6);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: pp-fade .25s ease;
}
.pp-modal {
  background: var(--surface);
  border-radius: 24px;
  padding: 40px 44px;
  max-width: 480px; width: 100%;
  box-shadow: var(--shadow2);
  animation: pp-rise .35s cubic-bezier(.22,.68,0,1.2);
}
.pp-modal-icon {
  width: 56px; height: 56px;
  background: rgba(196,149,58,.1);
  border: 1px solid rgba(196,149,58,.25);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  margin-bottom: 20px;
}
.pp-modal-title {
  font-family: var(--f-display);
  font-size: 28px; font-weight: 600;
  letter-spacing: -.01em;
  margin-bottom: 10px;
  line-height: 1.2;
}
.pp-modal-text {
  font-size: 14px; color: var(--muted);
  line-height: 1.65; margin-bottom: 28px;
}
.pp-modal-btns { display: flex; gap: 12px; }
.pp-btn-primary {
  flex: 1; padding: 13px 20px;
  background: var(--ink); color: #fff;
  border: none; border-radius: 12px;
  font-family: var(--f-body); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background .15s, transform .15s;
}
.pp-btn-primary:hover { background: var(--ink2); transform: translateY(-1px); }
.pp-btn-secondary {
  flex: 1; padding: 13px 20px;
  background: var(--bg); color: var(--muted);
  border: 1px solid var(--border); border-radius: 12px;
  font-family: var(--f-body); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background .15s;
}
.pp-btn-secondary:hover { background: #ebecf0; }

/* ── SKELETON ── */
.pp-skeleton { padding: 40px; max-width: 900px; margin: 0 auto; }
.pp-skel-hero {
  background: var(--surface); border-radius: var(--r);
  padding: 40px; display: flex; gap: 28px; align-items: center;
  border: 1px solid var(--border); margin-bottom: 20px;
}
.pp-skel-avatar {
  width: 96px; height: 96px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(90deg, #e8ebf2 25%, #d8dce8 50%, #e8ebf2 75%);
  background-size: 400% 100%;
  animation: pp-shimmer 1.5s ease infinite;
}
.pp-skel-line {
  border-radius: 6px; height: 13px;
  background: linear-gradient(90deg, #e8ebf2 25%, #d8dce8 50%, #e8ebf2 75%);
  background-size: 400% 100%;
  animation: pp-shimmer 1.5s ease infinite;
  margin-bottom: 10px;
}
.pp-skel-line.w30 { width: 30%; }
.pp-skel-line.w60 { width: 60%; }
.pp-skel-line.w80 { width: 80%; }
.pp-skel-line.w45 { width: 45%; }

/* ── MAIN LAYOUT ── */
.pp-page { max-width: 1080px; margin: 0 auto; padding: 32px 24px 64px; }
@media (max-width: 640px) { .pp-page { padding: 16px 14px 48px; } }

/* ── HERO CARD ── */
.pp-hero {
  background: var(--surface);
  border-radius: 20px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
  margin-bottom: 20px;
  opacity: 0;
  animation: pp-rise .5s cubic-bezier(.22,.68,0,1.2) .04s forwards;
}
.pp-hero-banner {
  height: 88px;
  background: linear-gradient(135deg, var(--ink) 0%, var(--ink2) 50%, #1e3060 100%);
  position: relative;
  overflow: hidden;
}
.pp-hero-banner::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 100% at 80% 50%, rgba(196,149,58,.18) 0%, transparent 70%);
}
.pp-hero-banner::after {
  content: 'DocPats';
  position: absolute;
  right: 24px; bottom: -16px;
  font-family: var(--f-display);
  font-size: 80px; font-weight: 600;
  color: rgba(255,255,255,.04);
  letter-spacing: -.02em;
  line-height: 1;
  pointer-events: none;
}
.pp-hero-body {
  padding: 0 28px 24px;
  display: flex; align-items: flex-end;
  gap: 20px; flex-wrap: wrap;
}
.pp-avatar-wrap { position: relative; margin-top: -36px; flex-shrink: 0; }
.pp-avatar {
  width: 82px; height: 82px;
  border-radius: 20px;
  border: 3px solid var(--surface);
  box-shadow: 0 4px 20px rgba(11,17,32,.18);
  object-fit: cover;
  background: var(--bg);
  display: block;
}
.pp-avatar-dot {
  position: absolute; bottom: 4px; right: 4px;
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--success);
  border: 2px solid var(--surface);
}
.pp-hero-info { flex: 1; min-width: 0; padding-top: 12px; }
.pp-hero-name {
  font-family: var(--f-display);
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
  margin-bottom: 4px;
  letter-spacing: -.01em;
}
.pp-hero-meta {
  display: flex; gap: 16px; flex-wrap: wrap; margin-top: 6px;
}
.pp-hero-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--muted);
  background: var(--bg); border: 1px solid var(--border);
  padding: 3px 10px; border-radius: 20px;
}
.pp-hero-chip.active { color: var(--teal); background: rgba(13,148,136,.06); border-color: rgba(13,148,136,.2); }
.pp-hero-chip.active::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--teal); animation: pp-pulse 2s ease infinite; }
.pp-hero-actions { display: flex; gap: 10px; align-items: flex-end; padding-top: 12px; margin-left: auto; }

/* ── TAB LAYOUT ── */
.pp-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  opacity: 0;
  animation: pp-rise .5s cubic-bezier(.22,.68,0,1.2) .16s forwards;
}
@media (max-width: 760px) { .pp-layout { grid-template-columns: 1fr; } }

/* ── SIDEBAR TABS ── */
.pp-tabs {
  background: var(--surface);
  border-radius: var(--r);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
  height: fit-content;
  position: sticky;
  top: 20px;
}
.pp-tabs-head {
  padding: 14px 16px 10px;
  font-family: var(--f-mono); font-size: 9px;
  letter-spacing: .14em; text-transform: uppercase;
  color: var(--sub); border-bottom: 1px solid var(--border2);
}
.pp-tab {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 16px;
  font-size: 13px; font-weight: 500;
  color: var(--muted);
  cursor: pointer; border: none; background: none;
  width: 100%; text-align: left;
  border-left: 2px solid transparent;
  transition: all .14s;
  border-bottom: 1px solid var(--border2);
}
.pp-tab:last-child { border-bottom: none; }
.pp-tab:hover { background: var(--bg); color: var(--ink); }
.pp-tab.active {
  background: rgba(196,149,58,.06);
  color: var(--gold);
  border-left-color: var(--gold);
  font-weight: 600;
}
.pp-tab-icon { font-size: 15px; flex-shrink: 0; width: 18px; text-align: center; }
.pp-tab-danger.active { background: rgba(220,38,38,.05); color: var(--danger); border-left-color: var(--danger); }
.pp-tab-danger:hover { color: var(--danger); }

/* ── CONTENT PANEL ── */
.pp-content {
  background: var(--surface);
  border-radius: var(--r);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.pp-content-head {
  padding: 22px 28px 18px;
  border-bottom: 1px solid var(--border2);
  display: flex; align-items: center; gap: 12px;
}
.pp-content-icon {
  width: 36px; height: 36px;
  border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  background: rgba(196,149,58,.08); border: 1px solid rgba(196,149,58,.2);
}
.pp-content-title {
  font-family: var(--f-display);
  font-size: 20px; font-weight: 600; font-style: italic;
  color: var(--ink); letter-spacing: -.01em;
}
.pp-content-body { padding: 24px 28px; }

/* ── OVERVIEW ROWS ── */
.pp-overview { display: flex; flex-direction: column; gap: 0; }
.pp-ov-row {
  display: grid; grid-template-columns: 180px 1fr;
  padding: 13px 0; border-bottom: 1px solid var(--border2);
  align-items: center; gap: 16px;
}
.pp-ov-row:last-child { border-bottom: none; }
.pp-ov-label {
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--sub); font-weight: 500;
}
.pp-ov-value { font-size: 14px; color: var(--ink); }
.pp-ov-value.muted { color: var(--sub); font-style: italic; }
.pp-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--f-mono); font-size: 10px;
  letter-spacing: .06em; text-transform: uppercase; font-weight: 500;
  padding: 3px 10px; border-radius: 20px;
}
.pp-badge.green { background: rgba(5,150,105,.08); color: var(--success); border: 1px solid rgba(5,150,105,.2); }
.pp-badge.gold  { background: rgba(196,149,58,.08); color: var(--gold);    border: 1px solid rgba(196,149,58,.2); }
.pp-badge.slate { background: rgba(45,58,85,.06);   color: var(--slate);   border: 1px solid rgba(45,58,85,.15); }

/* ── SECTION DIVIDER ── */
.pp-section-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 24px 0 16px;
}
.pp-section-divider-line { flex: 1; height: 1px; background: var(--border2); }
.pp-section-divider-text {
  font-family: var(--f-mono); font-size: 9px;
  letter-spacing: .14em; text-transform: uppercase;
  color: var(--sub); white-space: nowrap;
}

/* ── FORM ── */
.pp-form-group { margin-bottom: 20px; }
.pp-label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--slate); letter-spacing: .02em;
  margin-bottom: 7px;
}
.pp-label-hint { font-weight: 400; color: var(--sub); margin-left: 6px; font-size: 11px; }
.pp-input {
  width: 100%; padding: 11px 14px;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: var(--r-sm); font-family: var(--f-body); font-size: 14px;
  color: var(--ink); outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.pp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(196,149,58,.12); background: var(--surface); }
.pp-input:disabled { opacity: .55; cursor: not-allowed; }
.pp-textarea { resize: vertical; min-height: 100px; }
.pp-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7899' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; cursor: pointer; }
.pp-hint { font-size: 11.5px; color: var(--sub); margin-top: 5px; line-height: 1.45; }
.pp-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 560px) { .pp-row-2 { grid-template-columns: 1fr; } }

.pp-year-row { display: flex; align-items: center; gap: 10px; }
.pp-year-input { width: 100px !important; }
.pp-year-sep { color: var(--sub); font-size: 13px; }

/* ── SUBMIT BUTTON ── */
.pp-submit {
  margin-top: 28px; padding: 13px 32px;
  background: var(--ink); color: #fff;
  border: none; border-radius: 12px;
  font-family: var(--f-body); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: background .15s, transform .15s, box-shadow .15s;
}
.pp-submit:hover { background: var(--ink2); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(11,17,32,.2); }
.pp-submit:active { transform: translateY(0); }
.pp-submit.danger { background: var(--danger); }
.pp-submit.danger:hover { background: #b91c1c; }
.pp-submit.success { background: var(--teal); }
.pp-submit.success:hover { background: #0b7a70; }

/* ── AVATAR GRID ── */
.pp-avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 46px);
  gap: 8px; margin-top: 4px;
}
.pp-avatar-option {
  width: 46px; height: 46px; border-radius: 12px;
  object-fit: cover; cursor: pointer;
  border: 2px solid transparent;
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.pp-avatar-option:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(11,17,32,.15); }
.pp-avatar-option.selected { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(196,149,58,.2); }

/* ── ALERTS ── */
.pp-alert {
  padding: 12px 16px; border-radius: 10px; font-size: 13.5px;
  margin-top: 14px; line-height: 1.5;
}
.pp-alert.success { background: rgba(5,150,105,.08); color: var(--success); border: 1px solid rgba(5,150,105,.2); }
.pp-alert.danger  { background: rgba(220,38,38,.08); color: var(--danger);  border: 1px solid rgba(220,38,38,.2); }

/* ── TOGGLE ── */
.pp-toggle {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--muted);
  cursor: pointer; user-select: none;
  padding: 8px 0; transition: color .15s;
}
.pp-toggle:hover { color: var(--ink); }

/* ── SOCIAL CARD ── */
.pp-social-card {
  background: var(--surface);
  border-radius: var(--r); border: 1px solid var(--border);
  box-shadow: var(--shadow); overflow: hidden;
  margin-top: 20px;
  opacity: 0;
  animation: pp-rise .5s cubic-bezier(.22,.68,0,1.2) .28s forwards;
}
.pp-social-card-body {
  padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.pp-social-avatar {
  width: 100px; height: 100px; border-radius: 24px;
  object-fit: cover;
  border: 3px solid var(--border); box-shadow: var(--shadow2);
}
.pp-social-name {
  font-family: var(--f-display); font-size: 22px; font-weight: 600;
  font-style: italic; text-align: center; line-height: 1.2;
}
.pp-social-links { display: flex; gap: 10px; }
.pp-social-link {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg); border: 1px solid var(--border);
  color: var(--muted); font-size: 16px;
  text-decoration: none; transition: all .15s;
}
.pp-social-link:hover { background: var(--ink); color: #fff; border-color: var(--ink); transform: translateY(-2px); }

/* ── ANIMATIONS ── */
@keyframes pp-rise  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pp-fade  { from { opacity: 0; } to { opacity: 1; } }
@keyframes pp-pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
@keyframes pp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

/* ── TABS CONFIG ── */
const TABS = [
  { id: "overview", icon: "👤", labelKey: "tab.overview" },
  { id: "clinic", icon: "🏥", labelKey: "tab.clinic" },
  { id: "edit", icon: "✏️", labelKey: "tab.edit" },
  { id: "settings", icon: "⚙️", labelKey: "tab.settings" },
  {
    id: "password",
    icon: "🔒",
    labelKey: "tab.password",
    cls: "pp-tab-danger",
  },
  { id: "phone", icon: "📱", labelKey: "tab.phone" },
  { id: "email", icon: "📧", labelKey: "tab.email" },
];

/* ── MODAL ── */
const ClinicModal = ({ onClose, onConfirm, t }) => (
  <div className="pp-modal-backdrop" onClick={onClose}>
    <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
      <div className="pp-modal-icon">🏥</div>
      <div className="pp-modal-title">{t("modal.title")}</div>
      <div className="pp-modal-text">{t("modal.text")}</div>
      <div className="pp-modal-btns">
        <button className="pp-btn-primary" onClick={onConfirm}>
          {t("modal.confirm")}
        </button>
        <button className="pp-btn-secondary" onClick={onClose}>
          {t("modal.cancel")}
        </button>
      </div>
    </div>
  </div>
);

/* ── SKELETON ── */
const Skeleton = () => (
  <div className="pp-skeleton">
    <div className="pp-skel-hero">
      <div className="pp-skel-avatar" />
      <div style={{ flex: 1 }}>
        <div
          className="pp-skel-line w60"
          style={{ height: 20, marginBottom: 14 }}
        />
        <div className="pp-skel-line w45" />
        <div className="pp-skel-line w30" />
      </div>
    </div>
    <div
      className="pp-skel-line w80"
      style={{ height: 16, marginBottom: 12 }}
    />
    <div
      className="pp-skel-line w60"
      style={{ height: 16, marginBottom: 12 }}
    />
    <div className="pp-skel-line w45" style={{ height: 16 }} />
  </div>
);

/* ══════════════════════════════════════════════════ */
export default function HomePatientMainPage() {
  const { t } = useTranslation("HomePatientMainPage");
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL;

  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isPatientInClinic, setIsPatientInClinic] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [baseline, setBaseline] = useState(null);

  // profile fields
  const [company, setCompany] = useState("");
  const [job, setJob] = useState("");
  const [about, setAbout] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhone] = useState("");
  const [everyoneEmail, setEveryoneEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("ru");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [educationInstitution, setEducationInstitution] = useState("");
  const [educationStartYear, setEducationStartYear] = useState(1925);
  const [educationEndYear, setEducationEndYear] = useState(2025);
  const [specializationInstitution, setSpecializationInstitution] =
    useState("");
  const [specializationStartYear, setSpecializationStartYear] = useState(1925);
  const [specializationEndYear, setSpecializationEndYear] = useState(2025);

  // password
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [renewPassword, setRenewPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // phone change
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  // email change
  const [oldEmail, setOldEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [otpEmailCode, setEmailOtpCode] = useState("");
  const [otpEmailSent, setEmailOtpSent] = useState(false);
  const [messageEmail, setEmailMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  /* ── AUTH ── */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (data?.authenticated) {
          setIsAuthenticated(true);
          const u = data.user || {};
          setUserId(u.userId || u._id);
          setPreferredLanguage(u.preferredLanguage ?? "ru");
          setCountry(u.country ?? "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAuthLoaded(true);
      }
    })();
  }, []);

  /* ── CLINIC CHECK ── */
  useEffect(() => {
    if (!authLoaded || !isAuthenticated) return;
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/patient-profile/check-patient-in-clinic`,
          { withCredentials: true },
        );
        setIsPatientInClinic(Boolean(data.exists));
      } catch {
        setIsPatientInClinic(false);
      }
    })();
  }, [authLoaded, isAuthenticated]);

  /* ── PROFILE LOAD ── */
  useEffect(() => {
    if (
      !authLoaded ||
      !isAuthenticated ||
      !userId ||
      isPatientInClinic !== true
    )
      return;
    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/patient-profile/profile-user-patient/${userId}`,
          { withCredentials: true },
        );
        setProfile(data);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [authLoaded, isAuthenticated, userId, isPatientInClinic]);

  /* ── FILL FIELDS FROM PROFILE ── */
  useEffect(() => {
    if (!profile) return;
    if (profile?.newPatientPolyclinic?._id) setIsPatientInClinic(true);
    setPhone(
      (
        profile?.newPatientPolyclinic?.phoneNumber ||
        profile?.phoneNumber ||
        ""
      ).replace(/\D/g, ""),
    );
    setBio(profile.bio || "");
    setEducationInstitution(
      profile?.patientProfile?.educationInstitution ?? "",
    );
    setEducationStartYear(profile?.patientProfile?.educationStartYear ?? 1925);
    setEducationEndYear(profile?.patientProfile?.educationEndYear ?? 2025);
    setSpecializationInstitution(
      profile?.patientProfile?.specializationInstitution ?? "",
    );
    setSpecializationStartYear(
      profile?.patientProfile?.specializationStartYear ?? 1925,
    );
    setSpecializationEndYear(
      profile?.patientProfile?.specializationEndYear ?? 2025,
    );
    setBaseline({
      company: profile?.patientProfile?.company ?? "",
      job: profile?.patientProfile?.job ?? "",
      about: profile?.patientProfile?.about ?? "",
      address: profile?.patientProfile?.address ?? "",
      everyoneEmail: profile?.patientProfile?.everyoneEmail ?? "",
      preferredLanguage: profile?.preferredLanguage ?? "ru",
      country: profile?.newPatientPolyclinic?.country ?? profile?.country ?? "",
      phoneNumber:
        profile?.newPatientPolyclinic?.phoneNumber ??
        profile?.phoneNumber ??
        "",
      educationInstitution: profile?.patientProfile?.educationInstitution ?? "",
      educationStartYear: profile?.patientProfile?.educationStartYear ?? 1925,
      educationEndYear: profile?.patientProfile?.educationEndYear ?? 2025,
      specializationInstitution:
        profile?.patientProfile?.specializationInstitution ?? "",
      specializationStartYear:
        profile?.patientProfile?.specializationStartYear ?? 1925,
      specializationEndYear:
        profile?.patientProfile?.specializationEndYear ?? 2025,
    });
    setCompany("");
    setJob("");
    setAbout("");
    setAddress("");
    setEveryoneEmail("");
  }, [profile]);

  const buildPhotoUrl = (file) => {
    if (!file) return `${API_BASE}/uploads/default/doctor_consultation_02.jpg`;
    if (file.startsWith("http://") || file.startsWith("https://")) return file;
    if (file.startsWith("images/") || file.startsWith("default/"))
      return `${API_BASE}/uploads/${file}`;
    return `https://media.docpats.com/uploads/images/${file}`;
  };

  const maybeAppend = (fd, name, value, base) => {
    const v = typeof value === "string" ? value.trim() : value;
    if (v === "" || v == null) return;
    if (base != null && String(v) === String(base)) return;
    fd.append(name, v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      const fd = new FormData();
      const phoneToSend = phoneNumber
        ? "+" + String(phoneNumber).replace(/\D/g, "")
        : "";
      maybeAppend(fd, "company", company, baseline?.company);
      maybeAppend(fd, "job", job, baseline?.job);
      maybeAppend(fd, "about", about, baseline?.about);
      maybeAppend(fd, "address", address, baseline?.address);
      maybeAppend(fd, "phoneNumber", phoneToSend, baseline?.phoneNumber);
      maybeAppend(fd, "everyoneEmail", everyoneEmail, baseline?.everyoneEmail);
      maybeAppend(
        fd,
        "preferredLanguage",
        preferredLanguage,
        baseline?.preferredLanguage,
      );
      maybeAppend(fd, "country", country, baseline?.country);
      maybeAppend(
        fd,
        "educationInstitution",
        educationInstitution,
        baseline?.educationInstitution,
      );
      maybeAppend(
        fd,
        "educationStartYear",
        educationStartYear,
        baseline?.educationStartYear,
      );
      maybeAppend(
        fd,
        "educationEndYear",
        educationEndYear,
        baseline?.educationEndYear,
      );
      maybeAppend(
        fd,
        "specializationInstitution",
        specializationInstitution,
        baseline?.specializationInstitution,
      );
      maybeAppend(
        fd,
        "specializationStartYear",
        specializationStartYear,
        baseline?.specializationStartYear,
      );
      maybeAppend(
        fd,
        "specializationEndYear",
        specializationEndYear,
        baseline?.specializationEndYear,
      );
      if (profileImage) fd.append("image", profileImage);
      let hasFields = false;
      for (const _ of fd.keys()) {
        hasFields = true;
        break;
      }
      if (!hasFields) {
        alert(t("form.noChanges"));
        return;
      }
      await axios.post(
        `${API_BASE}/patient-profile/update-profile-of-patient`,
        fd,
        { withCredentials: true },
      );
      navigate("/patient/home-page");
    } catch (err) {
      alert(err?.response?.data?.message || t("form.error"));
    }
  };

  const handleSubmitMainSettings = async (e) => {
    e.preventDefault();
    if (!userId) return;
    const today = new Date();
    const minDate = new Date(
      today.getFullYear() - 100,
      today.getMonth(),
      today.getDate(),
    );
    const maxDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    try {
      await axios.post(
        `${API_BASE}/patient-profile/update-main-profile-of-patient`,
        {
          userId,
          avatar: selectedAvatar || undefined,
          username: document.getElementById("pp-username")?.value || undefined,
          dateOfBirth: dateOfBirth || undefined,
          bio: bio || undefined,
        },
        { withCredentials: true },
      );
      navigate("/patient/home-page");
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== renewPassword) {
      alert(t("form.passwordMismatch"));
      return;
    }
    try {
      const resp = await axios.post(
        `${API_BASE}/patient-profile/change-password-in-profile-of-patient`,
        { email, currentPassword, newPassword, renewPassword },
        { withCredentials: true },
      );
      alert(resp.data.message);
      navigate("/login");
    } catch {
      alert(t("form.error"));
    }
  };

  const handleChangePhone = async (e) => {
    e.preventDefault();
    const e164 = "+" + String(newPhoneNumber || "").replace(/\D/g, "");
    if (e164 === "+") {
      setMessage(t("form.invalidPhone"));
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/patient-profile/change-phone/by-patient`,
        { phoneNumber: e164 },
        { withCredentials: true },
      );
      setMessage(
        res?.data?.ok
          ? "✅ " + t("form.phoneSuccess")
          : res?.data?.message || t("form.error"),
      );
    } catch (err) {
      setMessage(err?.response?.data?.message || t("form.error"));
    }
  };

  const handleSendEmailOtp = async () => {
    if (!oldEmail || !newEmail) {
      setEmailMessage(t("form.emailRequired"));
      return;
    }
    try {
      const res = await axios.put(
        `${API_BASE}/doctor-profile/update-email-doctor`,
        { oldEmail, newEmail },
        { withCredentials: true },
      );
      if (res.data.otpSent) {
        setEmailOtpSent(true);
        setEmailMessage(t("form.otpSent"));
      }
    } catch (err) {
      setEmailMessage(err.response?.data?.message || t("form.error"));
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const res = await axios.put(
        `${API_BASE}/doctor-profile/update-email-doctor`,
        { oldEmail, newEmail, otpCode: otpEmailCode },
        { withCredentials: true },
      );
      setEmailMessage(res.data.message);
      if (res.data.message === "Email успешно обновлен.")
        setEmailOtpSent(false);
    } catch (err) {
      setEmailMessage(err.response?.data?.message || t("form.error"));
    } finally {
      setIsVerifying(false);
    }
  };

  const AVATAR_OPTIONS = [
    "/assets/img/avatars/boy01.png",
    "/assets/img/avatars/boy03.png",
    "/assets/img/avatars/boy02.png",
    "/assets/img/avatars/businessman.png",
    "/assets/img/avatars/cool.png",
    "/assets/img/avatars/dog.png",
    "/assets/img/avatars/gamer.png",
    "/assets/img/avatars/girl.png",
    "/assets/img/avatars/girl01.png",
    "/assets/img/avatars/gorilla.png",
    "/assets/img/avatars/lion.png",
    "/assets/img/avatars/man-avatar.png",
    "/assets/img/avatars/man.png",
    "/assets/img/avatars/man01.png",
    "/assets/img/avatars/man02.png",
    "/assets/img/avatars/man03.png",
    "/assets/img/avatars/man04.png",
    "/assets/img/avatars/man05.png",
    "/assets/img/avatars/ninja.png",
    "/assets/img/avatars/office-man.png",
    "/assets/img/avatars/profile.png",
    "/assets/img/avatars/rabbit.png",
    "/assets/img/avatars/student.png",
    "/assets/img/avatars/woman.png",
    "/assets/img/avatars/woman01.png",
    "/assets/img/avatars/woman02.png",
    "/assets/img/avatars/woman03.png",
    "/assets/img/avatars/woman04.png",
    "/assets/img/avatars/woman05.png",
    "/assets/img/avatars/woman06.png",
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "ru", label: "Русский" },
    { value: "az", label: "Azərbaycan" },
    { value: "tr", label: "Türkçe" },
  ];

  const photoUrl = buildPhotoUrl(profile?.patientProfile?.photo?.trim());
  const fullName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    t("profile.unknown");
  const val = (v) =>
    v || <span className="pp-ov-value muted">{t("profile.notSet")}</span>;

  const today = new Date();
  const maxDOB = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  )
    .toISOString()
    .split("T")[0];
  const minDOB = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate(),
  )
    .toISOString()
    .split("T")[0];

  /* ── TAB CONTENT ── */
  const renderTab = () => {
    if (!profile) return null;
    switch (activeTab) {
      case "overview":
        return (
          <div className="pp-overview">
            <div className="pp-ov-row">
              <div className="pp-ov-label">{t("profile.fullName")}</div>
              <div
                className="pp-ov-value"
                style={{
                  fontFamily: "var(--f-display)",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {fullName}
              </div>
            </div>
            {profile.patientProfile && (
              <>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.birthDate")}</div>
                  <div className="pp-ov-value">
                    {val(
                      profile.newPatientPolyclinic?.birthDate
                        ? new Date(
                            profile.newPatientPolyclinic.birthDate,
                          ).toLocaleDateString()
                        : null,
                    )}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.about")}</div>
                  <div className="pp-ov-value">
                    {val(profile.patientProfile.about)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.company")}</div>
                  <div className="pp-ov-value">
                    {val(profile.patientProfile.company)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.education")}</div>
                  <div className="pp-ov-value">
                    {val(profile.patientProfile.educationInstitution)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.eduYears")}</div>
                  <div className="pp-ov-value">
                    {profile.patientProfile.educationStartYear &&
                    profile.patientProfile.educationEndYear
                      ? `${profile.patientProfile.educationStartYear} — ${profile.patientProfile.educationEndYear}`
                      : val(null)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.address")}</div>
                  <div className="pp-ov-value">
                    {val(profile.patientProfile.address)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.job")}</div>
                  <div className="pp-ov-value">
                    {val(profile.patientProfile.job)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.publicEmail")}</div>
                  <div className="pp-ov-value">
                    {val(profile.patientProfile.everyoneEmail)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.systemEmail")}</div>
                  <div className="pp-ov-value">{val(profile.email)}</div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.phone")}</div>
                  <div className="pp-ov-value">
                    {val(
                      profile?.newPatientPolyclinic?.phoneNumber ||
                        profile?.phoneNumber,
                    )}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.status")}</div>
                  <div className="pp-ov-value">
                    <span className="pp-badge green">
                      {profile?.patientProfile?.status || t("profile.active")}
                    </span>
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("profile.payment")}</div>
                  <div className="pp-ov-value">
                    <span className="pp-badge gold">
                      {profile.patientProfile.paymentStatus || val(null)}
                    </span>
                  </div>
                </div>
              </>
            )}
            <div className="pp-ov-row">
              <div className="pp-ov-label">{t("profile.gender")}</div>
              <div className="pp-ov-value">{val(profile.bio)}</div>
            </div>
            <div className="pp-ov-row">
              <div className="pp-ov-label">{t("profile.language")}</div>
              <div className="pp-ov-value">
                <span className="pp-badge slate">
                  {profile.preferredLanguage || val(null)}
                </span>
              </div>
            </div>
            <div className="pp-ov-row">
              <div className="pp-ov-label">{t("profile.country")}</div>
              <div className="pp-ov-value">
                {val(
                  profile?.newPatientPolyclinic?.country || profile?.country,
                )}
              </div>
            </div>
            <div className="pp-ov-row">
              <div className="pp-ov-label">{t("profile.lastActive")}</div>
              <div className="pp-ov-value">
                {val(
                  profile.lastActive
                    ? new Date(profile.lastActive).toLocaleDateString()
                    : null,
                )}
              </div>
            </div>
          </div>
        );

      case "clinic":
        return (
          <div className="pp-overview">
            {profile.newPatientPolyclinic ? (
              <>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("clinic.patientId")}</div>
                  <div
                    className="pp-ov-value"
                    style={{ fontFamily: "var(--f-mono)", fontSize: 12 }}
                  >
                    {profile.newPatientPolyclinic.patientId}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">
                    {t("clinic.chronicDiseases")}
                  </div>
                  <div className="pp-ov-value">
                    {val(profile.newPatientPolyclinic.chronicDiseases)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("clinic.allergies")}</div>
                  <div className="pp-ov-value">
                    {val(profile.newPatientPolyclinic.allergies)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("clinic.operations")}</div>
                  <div className="pp-ov-value">
                    {val(profile.newPatientPolyclinic.operations)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("clinic.familyHistory")}</div>
                  <div className="pp-ov-value">
                    {val(profile.newPatientPolyclinic.familyHistoryOfDisease)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("clinic.immunization")}</div>
                  <div className="pp-ov-value">
                    {val(profile.newPatientPolyclinic.immunization)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("clinic.badHabits")}</div>
                  <div className="pp-ov-value">
                    {val(profile.newPatientPolyclinic.badHabits)}
                  </div>
                </div>
                <div className="pp-ov-row">
                  <div className="pp-ov-label">{t("clinic.about")}</div>
                  <div className="pp-ov-value">
                    {val(profile.newPatientPolyclinic.about)}
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: "var(--sub)", fontSize: 14 }}>
                {t("clinic.noData")}
              </p>
            )}
          </div>
        );

      case "edit":
        return (
          <form onSubmit={handleSubmit}>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.photo")}</label>
              <input
                type="file"
                accept="image/*"
                className="pp-input"
                onChange={(e) =>
                  e.target.files[0] && setProfileImage(e.target.files[0])
                }
              />
            </div>
            <div className="pp-row-2">
              <div className="pp-form-group">
                <label className="pp-label">{t("form.company")}</label>
                <input
                  type="text"
                  className="pp-input"
                  placeholder={baseline?.company || t("form.company")}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="pp-form-group">
                <label className="pp-label">{t("form.job")}</label>
                <input
                  type="text"
                  className="pp-input"
                  placeholder={baseline?.job || t("form.job")}
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                />
              </div>
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.about")}</label>
              <textarea
                className="pp-input pp-textarea"
                placeholder={baseline?.about || t("form.about")}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.address")}</label>
              <input
                type="text"
                className="pp-input"
                placeholder={baseline?.address || t("form.address")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">
                {t("form.phone")}{" "}
                <span className="pp-label-hint">{t("form.clinicVisible")}</span>
              </label>
              <PhoneInput
                country={"az"}
                value={phoneNumber}
                onChange={(v) => setPhone(v)}
                inputStyle={{
                  width: "100%",
                  fontFamily: "var(--f-body)",
                  fontSize: 14,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                }}
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.publicEmail")}</label>
              <input
                type="email"
                className="pp-input"
                placeholder={baseline?.everyoneEmail || t("form.publicEmail")}
                value={everyoneEmail}
                onChange={(e) => setEveryoneEmail(e.target.value)}
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.language")}</label>
              <select
                className="pp-input pp-select"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
              >
                {languages.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <div className="pp-hint">{t("form.languageHint")}</div>
            </div>
            <div className="pp-section-divider">
              <div className="pp-section-divider-line" />
              <div className="pp-section-divider-text">
                {t("form.education")}
              </div>
              <div className="pp-section-divider-line" />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">
                {t("form.educationInstitution")}
              </label>
              <input
                type="text"
                className="pp-input"
                placeholder={
                  baseline?.educationInstitution ||
                  t("form.educationInstitution")
                }
                value={educationInstitution}
                onChange={(e) => setEducationInstitution(e.target.value)}
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.eduYears")}</label>
              <div className="pp-year-row">
                <input
                  type="number"
                  className="pp-input pp-year-input"
                  min="1925"
                  max="2025"
                  value={educationStartYear}
                  onChange={(e) => setEducationStartYear(+e.target.value)}
                  onBlur={(e) =>
                    setEducationStartYear(
                      Math.min(
                        Math.max(+e.target.value || 1925, 1925),
                        educationEndYear,
                      ),
                    )
                  }
                />
                <span className="pp-year-sep">—</span>
                <input
                  type="number"
                  className="pp-input pp-year-input"
                  min="1925"
                  max="2025"
                  value={educationEndYear}
                  onChange={(e) => setEducationEndYear(+e.target.value)}
                  onBlur={(e) =>
                    setEducationEndYear(
                      Math.min(
                        Math.max(+e.target.value || 2025, educationStartYear),
                        2025,
                      ),
                    )
                  }
                />
              </div>
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.specialization")}</label>
              <input
                type="text"
                className="pp-input"
                placeholder={
                  baseline?.specializationInstitution ||
                  t("form.specialization")
                }
                value={specializationInstitution}
                onChange={(e) => setSpecializationInstitution(e.target.value)}
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.specYears")}</label>
              <div className="pp-year-row">
                <input
                  type="number"
                  className="pp-input pp-year-input"
                  min="1925"
                  max="2025"
                  value={specializationStartYear}
                  onChange={(e) => setSpecializationStartYear(+e.target.value)}
                  onBlur={(e) =>
                    setSpecializationStartYear(
                      Math.min(
                        Math.max(+e.target.value || 1925, 1925),
                        specializationEndYear,
                      ),
                    )
                  }
                />
                <span className="pp-year-sep">—</span>
                <input
                  type="number"
                  className="pp-input pp-year-input"
                  min="1925"
                  max="2025"
                  value={specializationEndYear}
                  onChange={(e) => setSpecializationEndYear(+e.target.value)}
                  onBlur={(e) =>
                    setSpecializationEndYear(
                      Math.min(
                        Math.max(
                          +e.target.value || 2025,
                          specializationStartYear,
                        ),
                        2025,
                      ),
                    )
                  }
                />
              </div>
            </div>
            <button type="submit" className="pp-submit">
              {t("form.save")}
            </button>
          </form>
        );

      case "settings":
        return (
          <form onSubmit={handleSubmitMainSettings}>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.nickname")}</label>
              <input
                type="text"
                id="pp-username"
                className="pp-input"
                placeholder={t("form.nickname")}
              />
            </div>
            <div className="pp-row-2">
              <div className="pp-form-group">
                <label className="pp-label">{t("form.firstName")}</label>
                <input
                  type="text"
                  className="pp-input"
                  value={profile?.firstName || ""}
                  disabled
                />
              </div>
              <div className="pp-form-group">
                <label className="pp-label">{t("form.lastName")}</label>
                <input
                  type="text"
                  className="pp-input"
                  value={profile?.lastName || ""}
                  disabled
                />
              </div>
            </div>
            <div className="pp-row-2">
              <div className="pp-form-group">
                <label className="pp-label">{t("form.dateOfBirth")}</label>
                <input
                  type="date"
                  className="pp-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  min={minDOB}
                  max={maxDOB}
                />
              </div>
              <div className="pp-form-group">
                <label className="pp-label">{t("form.gender")}</label>
                <select
                  className="pp-input pp-select"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                >
                  <option value="">{t("form.choose")}</option>
                  <option value="man">{t("form.man")}</option>
                  <option value="woman">{t("form.woman")}</option>
                </select>
              </div>
            </div>
            <div className="pp-section-divider">
              <div className="pp-section-divider-line" />
              <div className="pp-section-divider-text">
                {t("form.chooseAvatar")}
              </div>
              <div className="pp-section-divider-line" />
            </div>
            <div className="pp-avatar-grid">
              {AVATAR_OPTIONS.map((av) => (
                <img
                  key={av}
                  src={av}
                  alt="avatar"
                  className={`pp-avatar-option${selectedAvatar === av ? " selected" : ""}`}
                  onClick={() => setSelectedAvatar(av)}
                />
              ))}
            </div>
            <button
              type="submit"
              className="pp-submit"
              style={{ marginTop: 28 }}
            >
              {t("form.save")}
            </button>
          </form>
        );

      case "password":
        return (
          <form onSubmit={handleChangePassword}>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.email")}</label>
              <input
                type="email"
                className="pp-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.currentPassword")}</label>
              <input
                type={showPasswords ? "text" : "password"}
                className="pp-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="pp-row-2">
              <div className="pp-form-group">
                <label className="pp-label">{t("form.newPassword")}</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className="pp-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="pp-form-group">
                <label className="pp-label">{t("form.confirmPassword")}</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className="pp-input"
                  value={renewPassword}
                  onChange={(e) => setRenewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <label className="pp-toggle">
              <input
                type="checkbox"
                style={{ marginRight: 6 }}
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
              />
              {t("form.showPasswords")}
            </label>
            <br />
            <button type="submit" className="pp-submit danger">
              {t("form.changePassword")}
            </button>
          </form>
        );

      case "phone":
        return (
          <form onSubmit={handleChangePhone}>
            <div className="pp-form-group">
              <label className="pp-label">{t("form.newPhone")}</label>
              <PhoneInput
                country={"az"}
                value={newPhoneNumber}
                onChange={(v) => setNewPhoneNumber(v)}
                inputStyle={{
                  width: "100%",
                  fontFamily: "var(--f-body)",
                  fontSize: 14,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-sm)",
                }}
              />
            </div>
            <button type="submit" className="pp-submit success">
              {t("form.send")}
            </button>
            {message && (
              <div
                className={`pp-alert ${message.startsWith("✅") ? "success" : "danger"}`}
              >
                {message}
              </div>
            )}
          </form>
        );

      case "email":
        return (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="pp-row-2">
              <div className="pp-form-group">
                <label className="pp-label">{t("form.oldEmail")}</label>
                <input
                  type="email"
                  className="pp-input"
                  value={oldEmail}
                  onChange={(e) => setOldEmail(e.target.value)}
                  required
                />
              </div>
              <div className="pp-form-group">
                <label className="pp-label">{t("form.newEmailField")}</label>
                <input
                  type="email"
                  className="pp-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {otpEmailSent && (
              <div className="pp-form-group">
                <label className="pp-label">{t("form.otpCode")}</label>
                <input
                  type="text"
                  className="pp-input"
                  value={otpEmailCode}
                  onChange={(e) => setEmailOtpCode(e.target.value)}
                  placeholder="000000"
                  required
                />
              </div>
            )}
            {!otpEmailSent ? (
              <button
                type="button"
                className="pp-submit"
                onClick={handleSendEmailOtp}
              >
                {t("form.sendCode")}
              </button>
            ) : (
              <button
                type="button"
                className="pp-submit success"
                onClick={handleVerifyEmailOtp}
                disabled={isVerifying}
              >
                {isVerifying ? t("form.verifying") : t("form.verifyEmail")}
              </button>
            )}
            {messageEmail && (
              <div
                className={`pp-alert ${messageEmail.includes("успешно") || messageEmail.includes("sent") ? "success" : "danger"}`}
              >
                {messageEmail}
              </div>
            )}
          </form>
        );

      default:
        return null;
    }
  };

  const activeTabCfg = TABS.find((t) => t.id === activeTab);
  const tabIconMap = {
    overview: "👤",
    clinic: "🏥",
    edit: "✏️",
    settings: "⚙️",
    password: "🔒",
    phone: "📱",
    email: "📧",
  };
  const tabTitleMap = {
    overview: t("tab.overview"),
    clinic: t("tab.clinic"),
    edit: t("tab.edit"),
    settings: t("tab.settings"),
    password: t("tab.password"),
    phone: t("tab.phone"),
    email: t("tab.email"),
  };

  return (
    <div className="pp">
      <style>{S}</style>

      <OnboardingChecklist />

      {/* ── MODAL ── */}
      {isPatientInClinic === false && authLoaded && (
        <ClinicModal
          t={t}
          onClose={() => setIsPatientInClinic(true)}
          onConfirm={() => navigate("/patient/add-patient-to-clinic")}
        />
      )}

      {!profile ? (
        <Skeleton />
      ) : (
        <div className="pp-page">
          {/* ── HERO ── */}
          <div className="pp-hero">
            <div className="pp-hero-banner" />
            <div className="pp-hero-body">
              <div className="pp-avatar-wrap">
                <img
                  className="pp-avatar"
                  src={photoUrl}
                  alt={fullName}
                  onError={(e) => {
                    e.target.src = `${API_BASE}/uploads/default/doctor_consultation_02.jpg`;
                  }}
                />
                <div className="pp-avatar-dot" />
              </div>
              <div className="pp-hero-info">
                <div className="pp-hero-name">{fullName}</div>
                <div className="pp-hero-meta">
                  <span className="pp-hero-chip active">
                    {t("profile.online")}
                  </span>
                  {profile.preferredLanguage && (
                    <span className="pp-hero-chip">
                      {profile.preferredLanguage.toUpperCase()}
                    </span>
                  )}
                  {(profile?.newPatientPolyclinic?.country ||
                    profile?.country) && (
                    <span className="pp-hero-chip">
                      {profile?.newPatientPolyclinic?.country ||
                        profile?.country}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── TAB LAYOUT ── */}
          <div className="pp-layout">
            {/* Sidebar */}
            <div className="pp-tabs">
              <div className="pp-tabs-head">{t("nav.sections")}</div>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`pp-tab${tab.cls ? " " + tab.cls : ""}${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="pp-tab-icon">{tab.icon}</span>
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>

            {/* Content */}
            <div>
              <div className="pp-content">
                <div className="pp-content-head">
                  <div className="pp-content-icon">{tabIconMap[activeTab]}</div>
                  <div className="pp-content-title">
                    {tabTitleMap[activeTab]}
                  </div>
                </div>
                <div className="pp-content-body">{renderTab()}</div>
              </div>

              {/* Social card */}
              <div className="pp-social-card">
                <div className="pp-social-card-body">
                  <img
                    className="pp-social-avatar"
                    src={photoUrl}
                    alt={fullName}
                    onError={(e) => {
                      e.target.src = `${API_BASE}/uploads/default/doctor_consultation_02.jpg`;
                    }}
                  />
                  <div className="pp-social-name">{fullName}</div>
                  <div className="pp-social-links">
                    {[
                      ["bi-twitter", "#"],
                      ["bi-facebook", "#"],
                      ["bi-instagram", "#"],
                      ["bi-linkedin", "#"],
                    ].map(([cls, href]) => (
                      <Link key={cls} to={href} className="pp-social-link">
                        <i className={`bi ${cls}`} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
