import axios from "axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
/* ─────────────────────── STYLES ─────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@700&display=swap');

/* ── tokens ── */
.plc-root {
  --teal:        #0d6b5e;
  --teal-dark:   #094d44;
  --teal-light:  #12a08d;
  --teal-pale:   #e8f7f5;
  --teal-border: #a3ddd5;
  --navy:        #1e3a5f;
  --bg:          #f0f4f7;
  --surface:     #ffffff;
  --surface2:    #f7f9fb;
  --border:      #dde4ec;
  --border2:     #c5d0de;
  --ink:         #1a2533;
  --ink2:        #3d4f63;
  --ink3:        #7089a6;
  --red:         #c0392b;
  --red-pale:    #fdf1f0;
  --red-border:  #f0b8b2;
  --green:       #1a6b42;
  --green-pale:  #edf7f2;
  --green-border:#a3d9be;
  --blue:        #1a4fa0;
  --blue-pale:   #edf2fb;
  --blue-border: #b3c8ef;
  --amber:       #9a4d00;
  --amber-pale:  #fff8ee;
  --amber-border:#f5d39a;
  --radius:      12px;
  --radius-sm:   8px;
  --sh-sm: 0 1px 4px rgba(10,30,60,.06),0 2px 8px rgba(10,30,60,.04);
  --sh-md: 0 4px 16px rgba(10,30,60,.09),0 1px 4px rgba(10,30,60,.05);
  --sh-lg: 0 12px 40px rgba(10,30,60,.13),0 3px 12px rgba(10,30,60,.06);
  --tr: all .17s ease;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
}

/* ── page bg ── */
.plc-root { background: var(--bg); min-height: 100vh; }

/* ── HEADER ── */
.plc-header {
  background: linear-gradient(130deg, var(--teal-dark) 0%, var(--teal) 55%, #1a7a6e 100%);
  padding: 36px 40px 80px;
  position: relative;
  overflow: hidden;
}
.plc-header::before {
  content: '';
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 560px 280px at 96% 60%, rgba(18,160,141,.22) 0%, transparent 68%),
    radial-gradient(ellipse 260px 400px at -4% 120%, rgba(4,44,38,.55) 0%, transparent 55%);
  pointer-events: none;
}
.plc-header::after {
  content: '';
  position: absolute; bottom: -1px; left: 0; right: 0;
  height: 60px;
  background: var(--bg);
  clip-path: ellipse(54% 100% at 50% 100%);
}
.plc-header-inner {
  max-width: 1180px;
  margin: 0 auto;
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 18px;
}
.plc-header-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 10px; font-weight: 600; letter-spacing: .13em; text-transform: uppercase;
  color: rgba(255,255,255,.75);
  background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18);
  padding: 4px 13px; border-radius: 100px; margin-bottom: 12px;
  backdrop-filter: blur(6px);
}
.plc-header-eyebrow::before {
  content: ''; width: 6px; height: 6px; background: #5ef4dd; border-radius: 50%;
}
.plc-header-h1 {
  font-family: 'Merriweather', Georgia, serif;
  font-size: clamp(18px, 2.4vw, 28px);
  font-weight: 700; color: #fff; line-height: 1.2;
  letter-spacing: -.01em; margin: 0 0 5px;
}
.plc-header-sub { font-size: 12px; color: rgba(255,255,255,.6); }
.plc-header-cta {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 13px; font-weight: 700; padding: 11px 24px; border-radius: 100px;
  background: white; color: var(--teal-dark);
  border: none; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,.18); transition: var(--tr);
  text-decoration: none; font-family: 'Inter', sans-serif; white-space: nowrap;
}
.plc-header-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.2); background: var(--teal-pale); }

/* ── BODY ── */
.plc-body {
  max-width: 1680px; margin: -44px auto 0;
  padding: 0 28px 80px; position: relative; z-index: 2;
}
@media(max-width:680px){ .plc-body{ padding: 0 12px 60px; } }

/* ── CARD ── */
.plc-card {
  background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--sh-sm); overflow: hidden;
}

/* ── CARD HEAD ── */
.plc-card-head {
  padding: 16px 22px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px;
}
.plc-card-title {
  display: flex; align-items: center; gap: 10px;
  font-family: 'Merriweather', Georgia, serif;
  font-size: 15px; font-weight: 700; color: var(--ink);
}
.plc-card-icon {
  width: 30px; height: 30px; border-radius: 7px;
  background: var(--teal-pale); border: 1px solid var(--teal-border);
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}

/* ── PILLS ── */
.plc-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 9px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 100px; white-space: nowrap;
  border: 1px solid transparent;
}
.plc-pill::before { content: ''; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.plc-pill-private  { background: var(--blue-pale);  color: var(--blue);  border-color: var(--blue-border);  }
.plc-pill-private::before  { background: var(--blue);  }
.plc-pill-reg      { background: var(--green-pale); color: var(--green); border-color: var(--green-border); }
.plc-pill-reg::before      { background: var(--green); }
.plc-pill-total    { background: var(--teal-pale);  color: var(--teal);  border-color: var(--teal-border);  font-size:10px; padding:3px 10px; }
.plc-pill-total::before    { display:none; }
.plc-pill-active   { background: var(--amber-pale); color: var(--amber); border-color: var(--amber-border); font-size:10px; padding:3px 10px; }
.plc-pill-active::before   { display:none; }

/* ── BUTTONS ── */
.plc-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600;
  padding: 6px 14px; border-radius: 100px;
  border: 1.5px solid transparent;
  cursor: pointer; transition: var(--tr);
  font-family: 'Inter', sans-serif; white-space: nowrap; outline: none;
  text-decoration: none;
}
.plc-btn-ghost { color: var(--ink2); border-color: var(--border2); background: white; }
.plc-btn-ghost:hover { background: var(--surface2); border-color: var(--border); color: var(--ink); }
.plc-btn-teal {
  color: white; border: none;
  background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
  box-shadow: 0 3px 10px rgba(13,107,94,.28);
}
.plc-btn-teal:hover { box-shadow: 0 6px 18px rgba(13,107,94,.38); transform: translateY(-1px); }
.plc-btn-success { color: var(--green); border-color: var(--green-border); background: var(--green-pale); }
.plc-btn-success:hover { background: var(--green); color: white; border-color: var(--green); }
.plc-btn-danger  { color: var(--red); border-color: var(--red-border); background: var(--red-pale); }
.plc-btn-danger:hover  { background: var(--red);  color: white; border-color: var(--red);  }
.plc-btn-danger-solid { color: white; background: var(--red); border-color: var(--red); }
.plc-btn-danger-solid:hover { background: #a93226; border-color: #a93226; }
.plc-btn:disabled { opacity: .42; cursor: not-allowed; transform: none !important; }

/* ── SECTION STRIP ── */
.plc-strip {
  padding: 13px 22px; border-bottom: 1px solid var(--border);
  background: var(--surface2);
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}

/* ── CONTROLS ── */
.plc-ctrl-label { font-size: 11px; font-weight: 600; color: var(--ink3); white-space: nowrap; }
.plc-select, .plc-input {
  height: 32px; padding: 0 9px;
  background: white; border: 1.5px solid var(--border);
  border-radius: 7px; font-family: 'Inter', sans-serif;
  font-size: 12px; color: var(--ink); transition: var(--tr); outline: none;
}
.plc-select {
  appearance: none; cursor: pointer; padding-right: 24px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M1 1l3.5 3 3.5-3' stroke='%237089a6' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 8px center;
}
.plc-select:focus, .plc-input:focus {
  border-color: var(--teal-light); box-shadow: 0 0 0 3px rgba(13,107,94,.1);
}
.plc-input-jump { width: 68px; }
.plc-range-info { margin-left: auto; font-size: 11px; font-weight: 500; color: var(--ink3); white-space: nowrap; }

/* ── FILTER PANEL ── */
.plc-filter-panel {
  padding: 18px 22px;
  background: #f2f6fa;
  border-bottom: 1px solid var(--border);
}
.plc-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: 10px 14px;
}
.plc-filter-field { display: flex; flex-direction: column; gap: 4px; }
.plc-filter-label {
  font-size: 9px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--ink3);
}
.plc-filter-control {
  height: 32px; padding: 0 9px;
  background: white; border: 1.5px solid var(--border);
  border-radius: 7px; font-family: 'Inter', sans-serif;
  font-size: 12px; color: var(--ink); transition: var(--tr); outline: none; width: 100%;
}
.plc-filter-control::placeholder { color: var(--ink3); }
.plc-filter-control:focus { border-color: var(--teal-light); box-shadow: 0 0 0 3px rgba(13,107,94,.1); }
.plc-filter-select {
  appearance: none; cursor: pointer; padding-right: 24px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M1 1l3.5 3 3.5-3' stroke='%237089a6' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 8px center;
}
.plc-filter-hint { font-size: 9px; color: var(--amber); font-weight: 600; margin-top: 2px; }

/* ── COLUMNS MENU ── */
.plc-col-menu { position: relative; }
.plc-col-dropdown {
  position: absolute; right: 0; top: calc(100% + 5px); z-index: 200;
  background: white; border: 1px solid var(--border); border-radius: var(--radius-sm);
  box-shadow: var(--sh-md); padding: 10px 14px; min-width: 190px;
  animation: plcFadeIn .14s ease;
}
.plc-col-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; cursor: pointer; }
.plc-col-row input[type=checkbox] { width: 14px; height: 14px; accent-color: var(--teal); cursor: pointer; flex-shrink: 0; }
.plc-col-row label { font-size: 12px; font-weight: 500; color: var(--ink2); cursor: pointer; }

/* ── UNDO TOAST ── */
.plc-undo {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 11px 22px;
  background: var(--amber-pale); border-bottom: 1px solid var(--amber-border);
  animation: plcFadeIn .2s ease;
}
.plc-undo-txt { font-size: 12px; font-weight: 600; color: var(--amber); display: flex; align-items: center; gap: 7px; }

/* ── TABLE ── */
.plc-table-wrap { overflow-x: auto; }
.plc-table { width: 100%; border-collapse: collapse; font-size: 16px; }
.plc-table thead tr { background: var(--surface2); }
.plc-table th {
  padding: 10px 13px;
  font-size: 9px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase;
  color: var(--ink3); border-bottom: 2px solid var(--border);
  text-align: left; white-space: nowrap;
}
.plc-table th.sort { cursor: pointer; user-select: none; transition: var(--tr); }
.plc-table th.sort:hover { color: var(--teal); background: var(--teal-pale); }
.plc-sort-ic { font-size: 8px; margin-left: 3px; opacity: .45; }
.plc-sort-ic.on { opacity: 1; color: var(--teal); }
.plc-table td {
  padding: 10px 13px; border-bottom: 1px solid var(--border);
  vertical-align: middle; color: var(--ink2);
}
.plc-table tbody tr { transition: var(--tr); }
.plc-table tbody tr:last-child td { border-bottom: none; }
.plc-table tbody tr:hover td { background: var(--teal-pale); }
.plc-table-num { font-size: 10px; font-weight: 700; color: var(--ink3); text-align: center; width: 40px; }
.plc-patient-link { font-weight: 600; color: var(--teal); text-decoration: none; transition: var(--tr); }
.plc-patient-link:hover { color: var(--teal-light); text-decoration: underline; }
.plc-patient-email { font-size: 10px; color: var(--ink3); margin-top: 2px; }
.plc-name-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.plc-mono { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 10px; }

/* ── SKELETON ── */
.plc-skel {
  height: 12px; border-radius: 4px;
  background: linear-gradient(90deg, #e4eaf1 25%, #f0f4f7 50%, #e4eaf1 75%);
  background-size: 200% 100%;
  animation: plcShimmer 1.4s infinite;
}
@keyframes plcShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* ── EMPTY ── */
.plc-empty { padding: 54px 20px; text-align: center; color: var(--ink3); }
.plc-empty-icon { font-size: 44px; opacity: .22; margin-bottom: 12px; }
.plc-empty-txt  { font-size: 13px; font-weight: 500; }

/* ── PAGINATION ── */
.plc-pagination {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 16px 22px; border-top: 1px solid var(--border); flex-wrap: wrap;
}
.plc-page-btn {
  min-width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; padding: 0 8px;
  border-radius: 7px; border: 1.5px solid var(--border);
  background: white; color: var(--ink2);
  cursor: pointer; transition: var(--tr); font-family: 'Inter', sans-serif;
}
.plc-page-btn:hover:not(:disabled) { border-color: var(--teal-border); background: var(--teal-pale); color: var(--teal); }
.plc-page-btn:disabled { opacity: .38; cursor: not-allowed; }
.plc-page-info { font-size: 12px; font-weight: 600; color: var(--ink2); padding: 0 4px; white-space: nowrap; }

/* ── BOTTOM CTA ── */
.plc-cta { padding: 14px 22px; border-top: 1px solid var(--border); text-align: center; background: var(--surface2); }

/* ── MODAL ── */
.plc-modal-bg {
  position: fixed; inset: 0; background: rgba(10,20,40,.52);
  backdrop-filter: blur(4px); z-index: 1200;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.plc-modal {
  background: white; border-radius: var(--radius);
  max-width: 420px; width: 100%;
  box-shadow: var(--sh-lg); overflow: hidden;
  animation: plcFadeIn .18s ease;
}
.plc-modal-head {
  padding: 17px 22px 13px;
  border-bottom: 1px solid var(--border);
  background: var(--red-pale);
  display: flex; align-items: center; justify-content: space-between;
}
.plc-modal-title {
  font-family: 'Merriweather', Georgia, serif;
  font-size: 15px; font-weight: 700; color: var(--red);
}
.plc-modal-x {
  width: 26px; height: 26px; border: none; background: none;
  font-size: 18px; color: var(--ink3); cursor: pointer;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  transition: var(--tr); line-height: 1;
}
.plc-modal-x:hover { background: #f8e8e8; }
.plc-modal-body { padding: 18px 22px; font-size: 13px; color: var(--ink2); line-height: 1.65; }
.plc-modal-foot { padding: 12px 22px 18px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }

/* ── HIGHLIGHT ── */
mark { background: rgba(255,220,40,.45); border-radius: 2px; padding: 0 1px; }

/* ── ANIMATIONS ── */
@keyframes plcFadeIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
`;

/* ─────────────────────── COMPONENT ─────────────────────── */
export default function Polyclinic() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const patientId = location.state?.patientId;

  // -------- Auth / core state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -------- Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const jumpInputRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_URL;

  // -------- Sort (client-side for current page)
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  // -------- Filters + toggle panel
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState({
    archiveStatus: "active",
    patientType: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    identityDocument: "",
    email: "",
    patientUUID: "",
    phoneNumber: "",
    country: "",
    id: "",
  });

  const getPatientType = (patient) => patient.patientType || "registered";

  const PatientTypeBadge = ({ type }) => {
    if (type === "private") {
      return (
        <span className="plc-pill plc-pill-private" title="Private patient">
          PRIVATE
        </span>
      );
    }
    return (
      <span className="plc-pill plc-pill-reg" title="Registered patient">
        REGISTERED
      </span>
    );
  };

  const normalizePhone = (v) => {
    if (!v) return "";
    const raw = String(v).replace(/[^\d+]/g, "");
    const withPlus = raw.startsWith("+")
      ? raw
      : `+${raw.replace(/^(\+)?/, "")}`;
    return withPlus.replace(/\s+/g, "");
  };

  const looksLikeObjectId = (s) =>
    /^[a-f0-9]{24}$/i.test(String(s || "").trim());

  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(t);
  }, [filters]);

  // -------- Column visibility
  const [columns, setColumns] = useState({
    phone: true,
    country: false,
    uuid: false,
    id: false,
  });
  const [colsMenuOpen, setColsMenuOpen] = useState(false);
  const colsMenuRef = useRef(null);

  const printGender = (val) => {
    const raw = String(val ?? "")
      .trim()
      .toLowerCase();
    if (!raw) return "—";
    if (
      ["male", "man", "m", "erkek", "kişi", "м", "муж", "мужчина"].includes(raw)
    )
      return "Man";
    if (
      [
        "female",
        "woman",
        "f",
        "kadin",
        "qadın",
        "ж",
        "жен",
        "женщина",
      ].includes(raw)
    )
      return "Woman";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  useEffect(() => {
    if (!colsMenuOpen) return;
    const onDocClick = (e) => {
      if (colsMenuRef.current && !colsMenuRef.current.contains(e.target))
        setColsMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [colsMenuOpen]);

  // -------- Delete confirm + undo
  const [confirmId, setConfirmId] = useState(null);
  const [undoState, setUndoState] = useState(null);
  const undoTimeoutMs = 5000;

  // -------- Auth check
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const res = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        if (res.data?.authenticated) {
          setIsAuthenticated(true);
          setUserId(res.data.user?.userId || "");
          const role = String(res.data.user?.role || "").toLowerCase();
          setIsAdmin(role === "admin" || role === "superadmin");
        } else {
          navigate("/login");
        }
      } catch {
        navigate("/login");
      }
    };
    checkAuthentication();
  }, [navigate]);

  // -------- Helpers
  const calcAge = (dateStr) => {
    if (!dateStr) return "";
    const dob = new Date(dateStr);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("page", currentPage);
    params.set("pageSize", pageSize);
    if (debouncedFilters.firstName.trim())
      params.set("firstName", debouncedFilters.firstName.trim());
    if (debouncedFilters.lastName.trim())
      params.set("lastName", debouncedFilters.lastName.trim());
    if (debouncedFilters.birthDate)
      params.set("birthDate", debouncedFilters.birthDate);
    if (debouncedFilters.identityDocument.trim())
      params.set("identityDocument", debouncedFilters.identityDocument.trim());
    if (debouncedFilters.email.trim())
      params.set("email", debouncedFilters.email.trim());
    if (debouncedFilters.patientUUID.trim())
      params.set("patientUUID", debouncedFilters.patientUUID.trim());
    if (debouncedFilters.phoneNumber.trim())
      params.set("phoneNumber", normalizePhone(debouncedFilters.phoneNumber));
    if (debouncedFilters.archiveStatus)
      params.set("archiveStatus", debouncedFilters.archiveStatus);
    if (
      isAdmin &&
      debouncedFilters.id.trim() &&
      looksLikeObjectId(debouncedFilters.id)
    )
      params.set("id", debouncedFilters.id.trim());
    if (debouncedFilters.patientType)
      params.set("patientType", debouncedFilters.patientType);
    return params.toString();
  };
  useEffect(() => {
    if (!patientId) return;

    const el = document.getElementById(`patient-${patientId}`);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      el.style.background = "#fff6cc";

      setTimeout(() => {
        el.style.background = "";
      }, 30000); // 30 секунд
    }
  }, [patientId, patients]);
  // -------- Fetch
  useEffect(() => {
    if (!(isAuthenticated && userId)) return;
    const validSizes = [10, 25, 50];
    if (!validSizes.includes(pageSize)) setPageSize(10);
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const query = buildQuery();
        const url = `${API_BASE}/clinic/patients-polyclinic/${userId}?${query}`;
        const res = await axios.get(url, { withCredentials: true });
        setPatients(res.data.patients || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(
          typeof res.data.total === "number"
            ? res.data.total
            : res.data.patients?.length || 0,
        );
        setError("");
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Ошибка при загрузке пациентов");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [
    isAuthenticated,
    userId,
    currentPage,
    pageSize,
    debouncedFilters,
    isAdmin,
  ]);

  // -------- Sorting
  const sortedPatients = useMemo(() => {
    if (!sortKey) return patients;
    const arr = [...patients];
    arr.sort((a, b) => {
      let av, bv;
      if (sortKey === "name") {
        av =
          `${(a.firstName || "").toLowerCase()} ${(a.lastName || "").toLowerCase()}`.trim();
        bv =
          `${(b.firstName || "").toLowerCase()} ${(b.lastName || "").toLowerCase()}`.trim();
      } else if (sortKey === "age") {
        av = calcAge(a.birthDate) || 0;
        bv = calcAge(b.birthDate) || 0;
      } else if (sortKey === "created") {
        av = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bv = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else {
        av = 0;
        bv = 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [patients, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return <span className="plc-sort-ic">↕</span>;
    return (
      <span className={`plc-sort-ic on`}>{sortDir === "asc" ? "▲" : "▼"}</span>
    );
  };

  // -------- Filters
  const resetFilters = () => {
    setFilters({
      archiveStatus: "active",
      patientType: "",
      firstName: "",
      lastName: "",
      birthDate: "",
      identityDocument: "",
      email: "",
      patientUUID: "",
      phoneNumber: "",
      country: "",
      id: "",
    });
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(debouncedFilters).filter(([k, v]) => {
        if (!String(v).trim()) return false;
        if (k === "id" && !isAdmin) return false;
        return true;
      }).length,
    [debouncedFilters, isAdmin],
  );

  // -------- Highlight
  const mark = (text, needle) => {
    const t = String(text ?? "");
    const n = String(needle ?? "").trim();
    if (!n) return t;
    const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${esc})`, "ig");
    const parts = t.split(re);
    return parts.map((part, i) =>
      i % 2 === 1 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>,
    );
  };

  // -------- Delete with confirm + undo
  const requestDelete = (id) => setConfirmId(id);
  const cancelConfirm = () => setConfirmId(null);

  const actuallyDelete = async (patientId) => {
    try {
      await axios.delete(
        `${API_BASE}/clinic/patient-delete-from-offices-doctor/${patientId}`,
        { withCredentials: true },
      );
    } catch (err) {
      console.error("❌ Error deleting patient:", err);
      setPatients((prev) => {
        if (!undoState?.patient) return prev;
        return [undoState.patient, ...prev];
      });
    } finally {
      setUndoState(null);
    }
  };

  const actuallyDeletePrivate = async (patientId) => {
    try {
      await axios.delete(
        `${API_BASE}/clinic/private-patient-delete-from-offices-doctor/private-patient/${patientId}`,
        { withCredentials: true },
      );
    } catch (err) {
      console.error("❌ Error deleting patient:", err);
      setPatients((prev) => {
        if (!undoState?.patient) return prev;
        return [undoState.patient, ...prev];
      });
    } finally {
      setUndoState(null);
    }
  };

  const deleteByPatientType = async (patient) => {
    if (getPatientType(patient) === "private")
      return actuallyDeletePrivate(patient._id);
    return actuallyDelete(patient._id);
  };

  const confirmAndMaybeUndo = (patient) => {
    setConfirmId(null);
    setPatients((prev) => prev.filter((p) => p._id !== patient._id));
    const timer = setTimeout(() => {
      deleteByPatientType(patient);
    }, undoTimeoutMs);
    setUndoState({ patient, timer });
  };

  const undoDelete = () => {
    if (!undoState) return;
    clearTimeout(undoState.timer);
    setPatients((prev) => [undoState.patient, ...prev]);
    setUndoState(null);
  };

  // -------- Jump to page
  const handleJump = () => {
    const val = parseInt(jumpInputRef.current?.value || "1", 10);
    if (isNaN(val)) return;
    setCurrentPage(Math.min(Math.max(val, 1), totalPages));
  };

  const fromItem = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = (currentPage - 1) * pageSize + patients.length;

  const getPatientDetailUrl = (patient) =>
    getPatientType(patient) === "private"
      ? `/dp/private-patient-detail/${patient._id}`
      : `/dp/patient-detail/${patient._id}`;

  // col count for skeleton
  const colCount =
    7 +
    (columns.phone ? 1 : 0) +
    (columns.country ? 1 : 0) +
    (columns.uuid ? 1 : 0) +
    (isAdmin && columns.id ? 1 : 0);

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="plc-root">
      <style>{CSS}</style>

      {/* ═══ HEADER ═══ */}
      <div className="plc-header">
        <div className="plc-header-inner">
          <div>
            <div className="plc-header-eyebrow">DocPats · Polyclinic</div>
            <h1 className="plc-header-h1">🏥&nbsp;{t("polyclinic.title")}</h1>
            <p className="plc-header-sub">{t("polyclinic.header.subTitle")}</p>
          </div>
          <Link to="/dp/search-patient-polyclinic" className="plc-header-cta">
            ＋&nbsp;{t("polyclinic.states.addPatient")}
          </Link>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="plc-body">
        <div className="plc-card">
          {/* ── CARD HEAD ── */}
          <div className="plc-card-head">
            <div className="plc-card-title">
              <span className="plc-card-icon">🫀</span>
              {t("polyclinic.title")}
              {total > 0 && (
                <span className="plc-pill plc-pill-total">
                  {t("polyclinic.stats.total", { total })}
                </span>
              )}
              {activeFiltersCount > 0 && (
                <span className="plc-pill plc-pill-active">
                  {t("polyclinic.filters.activeCount", {
                    count: activeFiltersCount,
                  })}
                </span>
              )}
            </div>

            {/* Columns menu */}
            <div className="plc-col-menu" ref={colsMenuRef}>
              <button
                type="button"
                className="plc-btn plc-btn-ghost"
                onClick={() => setColsMenuOpen((o) => !o)}
                title={t("polyclinic.columnsMenu.toggleTitle")}
              >
                ⋮&nbsp;{t("polyclinic.columnsMenu.columnsButton")}
              </button>
              {colsMenuOpen && (
                <div className="plc-col-dropdown">
                  {[
                    {
                      key: "phone",
                      id: "colPhone",
                      label: t("polyclinic.columnsMenu.phone"),
                    },
                    {
                      key: "country",
                      id: "colCountry",
                      label: t("polyclinic.columnsMenu.country"),
                    },
                    {
                      key: "uuid",
                      id: "colUUID",
                      label: t("polyclinic.columnsMenu.uuid"),
                    },
                  ].map((col) => (
                    <label key={col.key} className="plc-col-row">
                      <input
                        type="checkbox"
                        id={col.id}
                        checked={columns[col.key]}
                        onChange={(e) =>
                          setColumns((c) => ({
                            ...c,
                            [col.key]: e.target.checked,
                          }))
                        }
                      />
                      <label htmlFor={col.id}>{col.label}</label>
                    </label>
                  ))}
                  {isAdmin && (
                    <label className="plc-col-row">
                      <input
                        type="checkbox"
                        id="colID"
                        checked={columns.id}
                        onChange={(e) =>
                          setColumns((c) => ({ ...c, id: e.target.checked }))
                        }
                      />
                      <label htmlFor="colID">
                        {t("polyclinic.columnsMenu.internalId")}
                      </label>
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── TOP CONTROLS ── */}
          <div className="plc-strip">
            <span className="plc-ctrl-label">
              {t("polyclinic.controls.rowsPerPageLabel")}
            </span>
            <select
              className="plc-select"
              style={{ width: 76 }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>

            <span className="plc-ctrl-label" style={{ marginLeft: 8 }}>
              {t("polyclinic.controls.jumpToLabel")}
            </span>
            <input
              ref={jumpInputRef}
              type="number"
              min={1}
              max={totalPages}
              className="plc-input plc-input-jump"
              placeholder={t("polyclinic.controls.pagePlaceholder")}
            />
            <button className="plc-btn plc-btn-teal" onClick={handleJump}>
              {t("polyclinic.controls.goButton")}
            </button>

            <span className="plc-range-info">
              {t("polyclinic.controls.showingRange", {
                from: fromItem,
                to: toItem,
                total,
              })}
            </span>
          </div>

          {/* ── FILTER TOGGLE BAR ── */}
          <div className="plc-strip" style={{ gap: 8 }}>
            <button
              type="button"
              className="plc-btn plc-btn-ghost"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              {filtersOpen
                ? `▲ ${t("polyclinic.filters.hide")}`
                : `▼ ${t("polyclinic.filters.show")}`}
            </button>
            <button
              type="button"
              className="plc-btn plc-btn-ghost"
              onClick={resetFilters}
            >
              ↺&nbsp;{t("polyclinic.filters.reset")}
            </button>
          </div>

          {/* ── FILTER PANEL ── */}
          {filtersOpen && (
            <div className="plc-filter-panel">
              <div className="plc-filter-grid">
                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.firstNameLabel")}
                  </span>
                  <input
                    type="text"
                    className="plc-filter-control"
                    placeholder={t("polyclinic.filters.firstNamePlaceholder")}
                    value={filters.firstName}
                    onChange={(e) => {
                      setFilters((s) => ({ ...s, firstName: e.target.value }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.lastNameLabel")}
                  </span>
                  <input
                    type="text"
                    className="plc-filter-control"
                    placeholder={t("polyclinic.filters.lastNamePlaceholder")}
                    value={filters.lastName}
                    onChange={(e) => {
                      setFilters((s) => ({ ...s, lastName: e.target.value }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.birthDateLabel")}
                  </span>
                  <input
                    type="date"
                    className="plc-filter-control"
                    value={filters.birthDate}
                    onChange={(e) => {
                      setFilters((s) => ({ ...s, birthDate: e.target.value }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.identityDocumentLabel")}
                  </span>
                  <input
                    type="text"
                    className="plc-filter-control"
                    placeholder={t(
                      "polyclinic.filters.identityDocumentPlaceholder",
                    )}
                    value={filters.identityDocument}
                    onChange={(e) => {
                      setFilters((s) => ({
                        ...s,
                        identityDocument: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.emailLabel")}
                  </span>
                  <input
                    type="email"
                    className="plc-filter-control"
                    placeholder={t("polyclinic.filters.emailPlaceholder")}
                    value={filters.email}
                    onChange={(e) => {
                      setFilters((s) => ({ ...s, email: e.target.value }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.patientUUIDLabel")}
                  </span>
                  <input
                    type="text"
                    className="plc-filter-control"
                    placeholder={t("polyclinic.filters.patientUUIDPlaceholder")}
                    value={filters.patientUUID}
                    onChange={(e) => {
                      setFilters((s) => ({
                        ...s,
                        patientUUID: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.phoneLabel")}
                  </span>
                  <input
                    type="tel"
                    className="plc-filter-control"
                    placeholder={t("polyclinic.filters.phonePlaceholder")}
                    value={filters.phoneNumber}
                    onChange={(e) => {
                      setFilters((s) => ({
                        ...s,
                        phoneNumber: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                    onBlur={(e) =>
                      setFilters((s) => ({
                        ...s,
                        phoneNumber: normalizePhone(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("polyclinic.filters.countryLabel")}
                  </span>
                  <input
                    type="text"
                    className="plc-filter-control"
                    placeholder={t("polyclinic.filters.countryPlaceholder")}
                    value={filters.country}
                    onChange={(e) =>
                      setFilters((s) => ({ ...s, country: e.target.value }))
                    }
                  />
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("filters.patientType")}
                  </span>
                  <select
                    className="plc-filter-control plc-filter-select"
                    value={filters.patientType}
                    onChange={(e) => {
                      setFilters((s) => ({
                        ...s,
                        patientType: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="">All</option>
                    <option value="registered">Registered</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div className="plc-filter-field">
                  <span className="plc-filter-label">
                    {t("filters.archiveStatus")}
                  </span>
                  <select
                    className="plc-filter-control plc-filter-select"
                    value={filters.archiveStatus}
                    onChange={(e) => {
                      setFilters((s) => ({
                        ...s,
                        archiveStatus: e.target.value,
                      }));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="all">All</option>
                  </select>
                </div>

                {isAdmin && (
                  <div className="plc-filter-field">
                    <span className="plc-filter-label">
                      {t("polyclinic.filters.internalIdLabel")}
                    </span>
                    <input
                      type="text"
                      className="plc-filter-control"
                      placeholder={t(
                        "polyclinic.filters.internalIdPlaceholder",
                      )}
                      value={filters.id}
                      onChange={(e) => {
                        setFilters((s) => ({ ...s, id: e.target.value }));
                        setCurrentPage(1);
                      }}
                    />
                    {filters.id.trim() && !looksLikeObjectId(filters.id) && (
                      <div className="plc-filter-hint">
                        {t("polyclinic.filters.internalIdHint")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── UNDO TOAST ── */}
          {undoState && (
            <div className="plc-undo">
              <span className="plc-undo-txt">
                🗂&nbsp;{t("polyclinic.undo.deleted")}
              </span>
              <button className="plc-btn plc-btn-ghost" onClick={undoDelete}>
                ↩&nbsp;{t("polyclinic.undo.undo")}
              </button>
            </div>
          )}

          {/* ── CONTENT ── */}
          {loading ? (
            <div className="plc-table-wrap">
              <table className="plc-table">
                <thead>
                  <tr>
                    <th>{t("polyclinic.table.number")}</th>
                    <th>{t("polyclinic.table.name")}</th>
                    <th>{t("polyclinic.table.age")}</th>
                    <th>{t("polyclinic.table.created")}</th>
                    {columns.phone && <th>{t("polyclinic.table.phone")}</th>}
                    <th>{t("polyclinic.table.gender")}</th>
                    {columns.country && (
                      <th>{t("polyclinic.table.country")}</th>
                    )}
                    {columns.uuid && <th>{t("polyclinic.table.uuid")}</th>}
                    {isAdmin && columns.id && (
                      <th>{t("polyclinic.table.id")}</th>
                    )}
                    <th>{t("polyclinic.table.delete")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: colCount }).map((__, j) => (
                        <td key={j}>
                          <div
                            className="plc-skel"
                            style={{ width: `${50 + Math.random() * 45}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : error ? (
            <div className="plc-empty">
              <div className="plc-empty-icon">⚠️</div>
              <div className="plc-empty-txt" style={{ color: "var(--red)" }}>
                {error}
              </div>
            </div>
          ) : patients.length === 0 ? (
            <div className="plc-empty">
              <div className="plc-empty-icon">🏥</div>
              <div className="plc-empty-txt">
                {t("polyclinic.states.nothingFound")}
              </div>
            </div>
          ) : (
            <>
              <div className="plc-table-wrap">
                <table className="plc-table">
                  <thead>
                    <tr>
                      <th>{t("polyclinic.table.number")}</th>
                      <th
                        className="sort"
                        onClick={() => toggleSort("name")}
                        title={t("polyclinic.table.sortNameTitle")}
                      >
                        {t("polyclinic.table.name")}&nbsp;{sortIcon("name")}
                      </th>
                      <th
                        className="sort"
                        onClick={() => toggleSort("age")}
                        title={t("polyclinic.table.sortAgeTitle")}
                      >
                        {t("polyclinic.table.age")}&nbsp;{sortIcon("age")}
                      </th>
                      <th
                        className="sort"
                        onClick={() => toggleSort("created")}
                        title={t("polyclinic.table.sortCreatedTitle")}
                      >
                        {t("polyclinic.table.created")}&nbsp;
                        {sortIcon("created")}
                      </th>
                      {columns.phone && <th>{t("polyclinic.table.phone")}</th>}
                      <th>{t("polyclinic.table.gender")}</th>
                      {columns.country && (
                        <th>{t("polyclinic.table.country")}</th>
                      )}
                      {columns.uuid && <th>{t("polyclinic.table.uuid")}</th>}
                      {isAdmin && columns.id && (
                        <th>{t("polyclinic.table.id")}</th>
                      )}
                      <th>{t("polyclinic.table.delete")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPatients
                      .filter((p) =>
                        filters.country.trim()
                          ? String(p.country || "")
                              .toLowerCase()
                              .includes(filters.country.trim().toLowerCase())
                          : true,
                      )
                      .filter((p) =>
                        isAdmin && filters.id.trim()
                          ? String(p._id || "")
                              .toLowerCase()
                              .includes(filters.id.trim().toLowerCase())
                          : true,
                      )
                      .filter((p) =>
                        !filters.patientType
                          ? true
                          : getPatientType(p) === filters.patientType,
                      )
                      .map((patient, index) => (
                        <tr key={patient._id} id={`patient-${patient._id}`}>
                          <td className="plc-table-num">
                            {(currentPage - 1) * pageSize + index + 1}
                          </td>

                          <td>
                            <div className="plc-name-row">
                              <Link
                                to={getPatientDetailUrl(patient)}
                                className="plc-patient-link"
                              >
                                {mark(
                                  patient.firstName,
                                  debouncedFilters.firstName,
                                )}{" "}
                                {mark(
                                  patient.lastName,
                                  debouncedFilters.lastName,
                                )}
                              </Link>
                              <PatientTypeBadge
                                type={getPatientType(patient)}
                              />
                            </div>
                            <div className="plc-patient-email">
                              {patient.email ||
                                (getPatientType(patient) === "private"
                                  ? "— no account —"
                                  : "")}
                            </div>
                          </td>

                          <td>{calcAge(patient.birthDate)}</td>
                          <td>
                            {patient.createdAt
                              ? format(
                                  new Date(patient.createdAt),
                                  "yyyy-MM-dd",
                                )
                              : ""}
                          </td>

                          {columns.phone && (
                            <td dir="ltr">
                              {debouncedFilters.phoneNumber
                                ? mark(
                                    patient.phoneNumber,
                                    debouncedFilters.phoneNumber,
                                  )
                                : patient.phoneNumber || ""}
                            </td>
                          )}

                          <td>{printGender(patient.bio)}</td>
                          {columns.country && <td>{patient.country || ""}</td>}
                          {columns.uuid && (
                            <td className="plc-mono">
                              {debouncedFilters.patientUUID
                                ? mark(
                                    patient.patientUUID,
                                    debouncedFilters.patientUUID,
                                  )
                                : patient.patientUUID || ""}
                            </td>
                          )}
                          {isAdmin && columns.id && (
                            <td className="plc-mono">
                              {filters.id.trim()
                                ? mark(patient._id, filters.id)
                                : patient._id}
                            </td>
                          )}

                          <td>
                            {/* ─ ARCHIVED: Restore private ─ */}
                            {filters.archiveStatus === "archived" &&
                              getPatientType(patient) === "private" && (
                                <button
                                  className="plc-btn plc-btn-success"
                                  onClick={async () => {
                                    try {
                                      await axios.patch(
                                        `${API_BASE}/clinic/private-patient-restore-from-archive/private-patient/${patient._id}/restore`,
                                        {},
                                        { withCredentials: true },
                                      );
                                      setPatients((prev) =>
                                        prev.filter(
                                          (p) => p._id !== patient._id,
                                        ),
                                      );
                                    } catch (err) {
                                      console.error("❌ Restore error:", err);
                                    }
                                  }}
                                >
                                  ↩ Restore
                                </button>
                              )}

                            {/* ─ ARCHIVED: Restore registered ─ */}
                            {getPatientType(patient) === "registered" &&
                              filters.archiveStatus === "archived" &&
                              patient.isArchived === true && (
                                <button
                                  className="plc-btn plc-btn-success"
                                  onClick={async () => {
                                    await axios.patch(
                                      `${API_BASE}/clinic/registred-patient-restore-from-archive/${patient._id}/restore`,
                                      {},
                                      { withCredentials: true },
                                    );
                                    setPatients((prev) =>
                                      prev.filter((p) => p._id !== patient._id),
                                    );
                                  }}
                                >
                                  ↩ Restore
                                </button>
                              )}

                            {/* ─ ACTIVE: Archive private ─ */}
                            {filters.archiveStatus !== "archived" &&
                              getPatientType(patient) === "private" &&
                              patient.isArchived !== true &&
                              !patient.isArchived && (
                                <button
                                  className="plc-btn plc-btn-danger"
                                  onClick={() => requestDelete(patient._id)}
                                >
                                  🗂 Archive
                                </button>
                              )}

                            {/* ─ ACTIVE: Archive registered ─ */}
                            {getPatientType(patient) === "registered" &&
                              filters.archiveStatus !== "archived" &&
                              patient.isArchived !== true && (
                                <button
                                  className="plc-btn plc-btn-danger"
                                  onClick={() => requestDelete(patient._id)}
                                >
                                  🗂 Archive
                                </button>
                              )}

                            {/* ─ CONFIRM MODAL ─ */}
                            {confirmId === patient._id && (
                              <div
                                className="plc-modal-bg"
                                onClick={cancelConfirm}
                              >
                                <div
                                  className="plc-modal"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="plc-modal-head">
                                    <div className="plc-modal-title">
                                      🗂&nbsp;
                                      {t("polyclinic.deleteModal.title")}
                                    </div>
                                    <button
                                      type="button"
                                      className="plc-modal-x"
                                      onClick={cancelConfirm}
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <div className="plc-modal-body">
                                    {t("polyclinic.deleteModal.body", {
                                      seconds: undoTimeoutMs / 1000,
                                    })}
                                  </div>
                                  <div className="plc-modal-foot">
                                    <button
                                      type="button"
                                      className="plc-btn plc-btn-ghost"
                                      onClick={cancelConfirm}
                                    >
                                      {t("polyclinic.deleteModal.cancel")}
                                    </button>
                                    <button
                                      type="button"
                                      className="plc-btn plc-btn-danger-solid"
                                      onClick={() => {
                                        const p = patients.find(
                                          (x) => x._id === patient._id,
                                        );
                                        if (p) confirmAndMaybeUndo(p);
                                      }}
                                    >
                                      {t("polyclinic.deleteModal.confirm")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* ─ PAGINATION ─ */}
              <div className="plc-pagination">
                <button
                  className="plc-page-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  {t("polyclinic.pagination.first")}
                </button>
                <button
                  className="plc-page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  {t("polyclinic.pagination.prev")}
                </button>
                <span className="plc-page-info">
                  {t("polyclinic.pagination.pageLabel", {
                    current: currentPage,
                    total: totalPages,
                  })}
                </span>
                <button
                  className="plc-page-btn"
                  onClick={() =>
                    setCurrentPage((p) => (p < totalPages ? p + 1 : p))
                  }
                  disabled={currentPage === totalPages}
                >
                  {t("polyclinic.pagination.next")}
                </button>
                <button
                  className="plc-page-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  {t("polyclinic.pagination.last")}
                </button>
              </div>
            </>
          )}

          {/* ─ BOTTOM CTA ─ */}
          <div className="plc-cta">
            <Link to="/dp/search-patient-polyclinic">
              <button
                className="plc-btn plc-btn-teal"
                style={{ padding: "10px 28px", fontSize: 13 }}
              >
                ＋&nbsp;{t("polyclinic.states.addPatient")}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
