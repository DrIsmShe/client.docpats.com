import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Универсально берём ID для удаления
function getRemoveId(friend) {
  return (
    friend?.userId ||
    friend?.profileUserId ||
    friend?.profileId ||
    friend?.id ||
    null
  );
}

function fmtDate(dt, t) {
  if (!dt) return t("friends.dateUnknown");
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return t("friends.dateUnknown");
  return format(d, "d MMMM yyyy", { locale: ru });
}

const toText = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(", ").trim();
  if (typeof v === "object") {
    return (v.title || v.name || v.label || v.ru || v.en || "")
      .toString()
      .trim();
  }
  return String(v).trim();
};

const toStringArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) =>
        typeof x === "string" ? x.trim() : (x?.name || x?.title || "").trim(),
      )
      .filter(Boolean);
  }
  const s = toText(v);
  if (!s) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
};

/* ===== STYLES ===== */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

  :root {
    --cream: #faf8f4;
    --cream2: #f3efe8;
    --parchment: #ede8df;
    --ink: #1c1917;
    --ink2: #44403c;
    --ink3: #78716c;
    --teal: #0f766e;
    --teal-mid: #0d9488;
    --teal-light: #14b8a6;
    --teal-pale: #f0fdfa;
    --teal-border: #99f6e4;
    --border: #e7e2d8;
    --border2: #d6d0c6;
    --shadow-sm: 0 2px 8px rgba(28,25,23,.07), 0 1px 3px rgba(28,25,23,.04);
    --shadow-md: 0 8px 24px rgba(28,25,23,.09), 0 2px 8px rgba(28,25,23,.04);
    --shadow-hover: 0 16px 40px rgba(15,118,110,.13), 0 4px 12px rgba(28,25,23,.06);
    --radius: 16px;
    --radius-sm: 10px;
    --transition: all .22s cubic-bezier(.4,0,.2,1);
    --font-display: 'Lora', Georgia, serif;
    --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  }

  .mfd-wrap {
    background: var(--cream);
    min-height: 100vh;
    font-family: var(--font-body);
    color: var(--ink);
  }

  /* ── HEADER ── */
  .mfd-header {
    background: linear-gradient(150deg, #0c4a6e 0%, #0f766e 60%, #065f46 100%);
    padding: 52px 40px 72px;
    position: relative;
    overflow: hidden;
  }
  .mfd-header::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 700px 400px at 90% 40%, rgba(20,184,166,.18) 0%, transparent 65%),
      radial-gradient(ellipse 300px 500px at 5% 110%, rgba(6,95,70,.5) 0%, transparent 60%);
    pointer-events: none;
  }
  .mfd-header::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 56px;
    background: var(--cream);
    clip-path: ellipse(55% 100% at 50% 100%);
  }
  .mfd-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
  }
  .mfd-header-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,.12);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.22);
    color: rgba(255,255,255,.88);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 18px;
  }
  .mfd-header-tag::before { content:''; width:6px; height:6px; background:#5eead4; border-radius:50%; }
  .mfd-header-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 3.5vw, 40px);
    font-weight: 700;
    color: white;
    line-height: 1.2;
    letter-spacing: -.015em;
    margin: 0 0 14px;
  }
  .mfd-header-stats {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  .mfd-stat-chip {
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.18);
    color: rgba(255,255,255,.8);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 14px;
    border-radius: 100px;
  }
  .mfd-stat-chip b { color: white; }
  .mfd-header-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .mfd-perpage-label {
    font-size: 12px;
    color: rgba(255,255,255,.7);
    font-weight: 500;
    white-space: nowrap;
  }
  .mfd-perpage-select {
    height: 36px;
    padding: 0 28px 0 12px;
    background: rgba(255,255,255,.15);
    border: 1.5px solid rgba(255,255,255,.25);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    backdrop-filter: blur(8px);
    transition: var(--transition);
  }
  .mfd-perpage-select:focus { border-color: rgba(255,255,255,.5); }
  .mfd-perpage-select option { background: #0f766e; color: white; }

  /* ── BODY ── */
  .mfd-body {
    max-width: 1200px;
    margin: -28px auto 0;
    padding: 0 32px 80px;
    position: relative;
    z-index: 2;
  }
  @media (max-width: 768px) { .mfd-body { padding: 0 16px 60px; } }

  /* ── FILTERS ── */
  .mfd-filters {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-md);
    overflow: hidden;
    margin-bottom: 32px;
  }
  .mfd-filters-head {
    background: var(--cream2);
    border-bottom: 1px solid var(--border);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .mfd-filters-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--ink3);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mfd-filters-title::before {
    content: '';
    width: 14px; height: 14px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230f766e' stroke-width='2.5'%3E%3Cpath d='M3 6h18M7 12h10M11 18h2'/%3E%3C/svg%3E") center/contain no-repeat;
  }
  .mfd-reset-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink3);
    background: none;
    border: 1.5px solid var(--border2);
    border-radius: 100px;
    padding: 5px 14px;
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
  }
  .mfd-reset-btn:hover { border-color: var(--teal); color: var(--teal); background: var(--teal-pale); }
  .mfd-filters-grid {
    padding: 20px 24px;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 768px) { .mfd-filters-grid { grid-template-columns: 1fr; } }

  .mfd-field { display: flex; flex-direction: column; gap: 6px; }
  .mfd-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: var(--ink3);
  }
  .mfd-input, .mfd-select {
    height: 40px;
    padding: 0 14px;
    background: var(--cream2);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--ink);
    transition: var(--transition);
    outline: none;
    width: 100%;
  }
  .mfd-input::placeholder { color: var(--ink3); }
  .mfd-input:focus, .mfd-select:focus {
    border-color: var(--teal-mid);
    background: white;
    box-shadow: 0 0 0 3px rgba(15,118,110,.1);
  }

  /* ── GRID ── */
  .mfd-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 48px;
  }
  @media (max-width: 640px) { .mfd-grid { grid-template-columns: 1fr 1fr; gap: 14px; } }
  @media (max-width: 400px) { .mfd-grid { grid-template-columns: 1fr; } }

  /* ── FRIEND CARD ── */
  .mfd-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: var(--transition);
    text-align: center;
  }
  .mfd-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-3px);
    border-color: var(--teal-border);
  }

  /* Avatar area */
  .mfd-card-avatar-wrap {
    width: 100%;
    padding: 28px 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(180deg, var(--cream2) 0%, white 100%);
    border-bottom: 1px solid var(--border);
  }
  .mfd-avatar {
    width: 88px; height: 88px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid white;
    box-shadow: 0 4px 16px rgba(15,118,110,.15);
    margin-bottom: 14px;
    display: block;
  }
  .mfd-avatar-initials {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--teal) 0%, var(--teal-light) 100%);
    border: 3px solid white;
    box-shadow: 0 4px 16px rgba(15,118,110,.2);
    margin-bottom: 14px;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }
  .mfd-card-name {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    text-decoration: none;
    line-height: 1.3;
    transition: color .15s;
    margin-bottom: 2px;
    display: block;
  }
  .mfd-card-name:hover { color: var(--teal); }
  .mfd-card-name-plain {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    line-height: 1.3;
    margin-bottom: 2px;
  }

  /* Body */
  .mfd-card-body {
    padding: 14px 18px 16px;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  /* Pills row */
  .mfd-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
  }
  .mfd-pill {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  .mfd-pill-spec {
    background: var(--teal-pale);
    color: var(--teal);
    border: 1px solid var(--teal-border);
  }
  .mfd-pill-country {
    background: var(--cream2);
    color: var(--ink2);
    border: 1px solid var(--border);
  }

  /* Added date */
  .mfd-added {
    font-size: 11px;
    color: var(--ink3);
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .mfd-added::before {
    content: '';
    width: 12px; height: 12px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2378716c' stroke-width='2'%3E%3Crect x='3' y='4' width='18' height='18' rx='2'/%3E%3Cpath d='M16 2v4M8 2v4M3 10h18'/%3E%3C/svg%3E") center/contain no-repeat;
    flex-shrink: 0;
    opacity: .7;
  }

  /* Remove btn */
  .mfd-remove-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #dc2626;
    background: white;
    border: 1.5px solid #fca5a5;
    border-radius: 100px;
    padding: 6px 16px;
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
    margin-top: 4px;
  }
  .mfd-remove-btn:hover:not(:disabled) { background: #fef2f2; border-color: #dc2626; }
  .mfd-remove-btn:disabled { opacity: .45; cursor: not-allowed; }

  /* ── EMPTY ── */
  .mfd-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 80px 20px;
    color: var(--ink3);
  }
  .mfd-empty-icon { font-size: 52px; opacity: .35; margin-bottom: 16px; }
  .mfd-empty-title {
    font-family: var(--font-display);
    font-size: 20px;
    color: var(--ink2);
    margin-bottom: 6px;
  }

  /* ── STATE ── */
  .mfd-state {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 60vh; gap: 16px;
    font-size: 14px; color: var(--ink3);
    background: var(--cream);
    font-family: var(--font-body);
  }
  .mfd-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--parchment);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: mfd-spin .7s linear infinite;
  }
  @keyframes mfd-spin { to { transform: rotate(360deg); } }

  /* ── PAGINATION ── */
  .mfd-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .mfd-page-btn {
    min-width: 38px; height: 38px;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 12px;
    background: white;
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink2);
    cursor: pointer;
    transition: var(--transition);
    font-family: var(--font-body);
    white-space: nowrap;
  }
  .mfd-page-btn:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); background: var(--teal-pale); }
  .mfd-page-btn.active { background: var(--teal); border-color: var(--teal); color: white; }
  .mfd-page-btn:disabled { opacity: .35; cursor: not-allowed; }
  .mfd-page-ellipsis { color: var(--ink3); font-size: 14px; padding: 0 4px; line-height: 38px; }
`;

export default function MyFriendsDoctors() {
  const { t } = useTranslation();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [country, setCountry] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/doctor-profile/api-follows/friends");
      const list = Array.isArray(res.data?.friends) ? res.data.friends : [];

      const normalized = list.map((f) => {
        const specArray =
          toStringArray(f.specializations) || toStringArray(f.specialization);

        const item = {
          id: f.id ?? f.profileId ?? null,
          profileId: f.profileId ?? f.id ?? null,
          userId: f.userId ?? f.user?._id ?? f.user?.id ?? null,
          firstName: f.firstName ?? f.user?.firstName ?? t("friends.firstName"),
          lastName: f.lastName ?? f.user?.lastName ?? t("friends.lastName"),
          avatar: f.avatar ?? f.user?.avatar ?? null,
          addedAt: f.addedAt ?? f.createdAt ?? null,
          specialization: (f.specialization ?? "").toString(),
          specializations: specArray,
          country: toText(f.country),
          _raw: f,
        };

        if (!item.specialization && item.specializations.length) {
          item.specialization = item.specializations.join(", ");
        }
        return item;
      });

      setFriends(normalized);
    } catch (err) {
      console.error("Ошибка:", err);
      setError(err?.response?.data?.message || t("friends.loadingError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    setPage(1);
  }, [search, specialty, country, pageSize]);

  const { specialtyOptions, countryOptions } = useMemo(() => {
    const specs = new Set();
    const countries = new Set();

    for (const f of friends) {
      const arr = toStringArray(
        f.specializations?.length ? f.specializations : f.specialization,
      );
      arr.forEach((s) => s && specs.add(s));
      const ctry = toText(f.country);
      if (ctry) countries.add(ctry);
    }

    return {
      specialtyOptions: Array.from(specs).sort((a, b) => a.localeCompare(b)),
      countryOptions: Array.from(countries).sort((a, b) => a.localeCompare(b)),
    };
  }, [friends]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return friends.filter((f) => {
      const name = `${f.firstName ?? ""} ${f.lastName ?? ""}`
        .trim()
        .toLowerCase();
      const okSearch = !q || name.includes(q);
      const specArr = toStringArray(
        f.specializations?.length ? f.specializations : f.specialization,
      );
      const okSpec = !specialty || specArr.includes(specialty);
      const okCountry = !country || toText(f.country) === country;
      return okSearch && okSpec && okCountry;
    });
  }, [friends, search, specialty, country]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const visible = filtered.slice(startIndex, startIndex + pageSize);

  const handleRemoveFriend = async (friend, e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const removeId = getRemoveId(friend);
    if (!removeId) {
      alert(t("friends.noId"));
      return;
    }
    if (!window.confirm(t("friends.confirmDelete"))) return;

    setRemovingId(removeId);
    const prev = friends;
    setFriends((p) => p.filter((f) => getRemoveId(f) !== removeId));

    try {
      await api.delete(
        `/doctor-profile/api-follows/friends/remove/${removeId}`,
      );
      await fetchFriends();
    } catch (err) {
      alert(t("friends.deleteError"));
      setFriends(prev);
    } finally {
      setRemovingId(null);
    }
  };

  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount, p + 1));
  const goLast = () => setPage(pageCount);

  const paginationItems = useMemo(() => {
    const items = [];
    const maxToShow = 7;
    if (pageCount <= maxToShow) {
      for (let i = 1; i <= pageCount; i++) items.push(i);
      return items;
    }
    const left = Math.max(2, safePage - 1);
    const right = Math.min(pageCount - 1, safePage + 1);
    items.push(1);
    if (left > 2) items.push("…");
    for (let i = left; i <= right; i++) items.push(i);
    if (right < pageCount - 1) items.push("…");
    items.push(pageCount);
    return items;
  }, [safePage, pageCount]);

  const clearFilters = () => {
    setSearch("");
    setSpecialty("");
    setCountry("");
    setPage(1);
  };

  const getInitials = (f) =>
    ((f.firstName?.[0] || "") + (f.lastName?.[0] || "")).toUpperCase() || "Dr";

  /* ── loading ── */
  if (loading)
    return (
      <div className="mfd-wrap">
        <style>{styles}</style>
        <div className="mfd-state">
          <div className="mfd-spinner" />
          <span>{t("friends.loading")}...</span>
        </div>
      </div>
    );

  /* ── error ── */
  if (error)
    return (
      <div className="mfd-wrap">
        <style>{styles}</style>
        <div className="mfd-state">
          <span style={{ color: "#dc2626", fontSize: 36, opacity: 0.4 }}>
            ⚠
          </span>
          <span style={{ color: "#dc2626" }}>{error}</span>
        </div>
      </div>
    );

  /* ── no friends at all ── */
  if (!friends.length)
    return (
      <div className="mfd-wrap">
        <style>{styles}</style>
        <div className="mfd-state">
          <div style={{ fontSize: 52, opacity: 0.35 }}>👥</div>
          <div
            style={{
              fontFamily: "'Lora',serif",
              fontSize: 20,
              color: "var(--ink2)",
            }}
          >
            {t("friends.noFriends")}
          </div>
        </div>
      </div>
    );

  return (
    <div className="mfd-wrap">
      <style>{styles}</style>

      {/* ── HEADER ── */}
      <div className="mfd-header">
        <div className="mfd-header-inner">
          <div>
            <div className="mfd-header-tag">DocPats · My Network</div>
            <h2 className="mfd-header-title">{t("friends.title")}</h2>
            <div className="mfd-header-stats">
              <div className="mfd-stat-chip">
                {t("friends.found")}: <b>&nbsp;{filtered.length}</b>
              </div>
              <div className="mfd-stat-chip">
                {t("friends.of")} <b>&nbsp;{friends.length}</b>{" "}
                {t("friends.of") ? "" : "total"}
              </div>
              <div className="mfd-stat-chip">
                стр. <b>&nbsp;{safePage}</b> / <b>{pageCount}</b>
              </div>
            </div>
          </div>

          <div className="mfd-header-controls">
            <span className="mfd-perpage-label">{t("friends.perPage")}:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="mfd-perpage-select"
            >
              {[8, 12, 16, 24, 36].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="mfd-body">
        {/* ── FILTERS ── */}
        <div className="mfd-filters">
          <div className="mfd-filters-head">
            <div className="mfd-filters-title">Поиск и фильтры</div>
            <button className="mfd-reset-btn" onClick={clearFilters}>
              ↺ {t("friends.resetFilters")}
            </button>
          </div>
          <div className="mfd-filters-grid">
            <div className="mfd-field">
              <label className="mfd-label">
                {t("friends.searchPlaceholder") || "Поиск"}
              </label>
              <input
                type="text"
                className="mfd-input"
                placeholder={t("friends.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="mfd-field">
              <label className="mfd-label">
                {t("friends.allSpecialties") || "Специальность"}
              </label>
              <select
                className="mfd-select"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">{t("friends.allSpecialties")}</option>
                {specialtyOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="mfd-field">
              <label className="mfd-label">Страна</label>
              <select
                className="mfd-select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Все страны</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── GRID ── */}
        <div className="mfd-grid">
          {visible.length === 0 ? (
            <div className="mfd-empty">
              <div className="mfd-empty-icon">🔍</div>
              <div className="mfd-empty-title">Никого не найдено</div>
            </div>
          ) : (
            visible.map((friend, idx) => {
              const linkId = friend?.id || friend?.profileId;
              const removeId = getRemoveId(friend);
              const added = fmtDate(friend?.addedAt, t);
              const specArr = friend.specializations?.length
                ? friend.specializations
                : toStringArray(friend.specialization);

              return (
                <div key={removeId || linkId || idx} className="mfd-card">
                  {/* Avatar area */}
                  <div className="mfd-card-avatar-wrap">
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={t("friends.doctor")}
                        className="mfd-avatar"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mfd-avatar-initials">
                        {getInitials(friend)}
                      </div>
                    )}

                    {linkId ? (
                      <Link
                        to={`/doctor/doctor-details/${linkId}`}
                        className="mfd-card-name"
                      >
                        {friend.firstName} {friend.lastName}
                      </Link>
                    ) : (
                      <div className="mfd-card-name-plain">
                        {friend.firstName} {friend.lastName}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="mfd-card-body">
                    {(specArr.length > 0 || toText(friend.country)) && (
                      <div className="mfd-pills">
                        {specArr.map((s) => (
                          <span key={s} className="mfd-pill mfd-pill-spec">
                            {s}
                          </span>
                        ))}
                        {toText(friend.country) && (
                          <span className="mfd-pill mfd-pill-country">
                            🌍 {toText(friend.country)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mfd-added">
                      {t("friends.added")}: {added}
                    </div>

                    <button
                      type="button"
                      className="mfd-remove-btn"
                      disabled={removingId === removeId}
                      onClick={(e) => handleRemoveFriend(friend, e)}
                    >
                      {removingId === removeId
                        ? t("friends.deleting")
                        : `✕ ${t("friends.remove")}`}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── PAGINATION ── */}
        {pageCount > 1 && (
          <div className="mfd-pagination">
            <button
              className="mfd-page-btn"
              onClick={goFirst}
              disabled={safePage === 1}
            >
              « {t("friends.pagination.first")}
            </button>
            <button
              className="mfd-page-btn"
              onClick={goPrev}
              disabled={safePage === 1}
            >
              ‹ {t("friends.pagination.prev")}
            </button>

            {paginationItems.map((it, i) =>
              it === "…" ? (
                <span key={`e-${i}`} className="mfd-page-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={it}
                  className={`mfd-page-btn${safePage === it ? " active" : ""}`}
                  onClick={() => setPage(it)}
                >
                  {it}
                </button>
              ),
            )}

            <button
              className="mfd-page-btn"
              onClick={goNext}
              disabled={safePage === pageCount}
            >
              {t("friends.pagination.next")} ›
            </button>
            <button
              className="mfd-page-btn"
              onClick={goLast}
              disabled={safePage === pageCount}
            >
              {t("friends.pagination.last")} »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
