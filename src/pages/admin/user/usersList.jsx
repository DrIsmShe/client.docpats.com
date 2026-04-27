import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { TbLockOpen2, TbLockOff, TbLockAccess } from "react-icons/tb";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { ImManWoman, ImWoman } from "react-icons/im";
import { MdAppRegistration } from "react-icons/md";
import { FaExchangeAlt, FaTheaterMasks, FaUser } from "react-icons/fa";
import { AiTwotoneMail } from "react-icons/ai";
import { PiFolderUserBold } from "react-icons/pi";
import { IoManOutline } from "react-icons/io5";

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL;
  // Фильтры
  const [genderFilter, setGenderFilter] = useState(""); // '', 'male', 'female'
  const [roleFilter, setRoleFilter] = useState(""); // '', 'admin'|'doctor'|'patient'
  const [ageFilter, setAgeFilter] = useState(""); // '', 'lt18'|'18_29'|'30_45'|'46_59'|'ge60'
  const [countryFilter, setCountryFilter] = useState(""); // страна
  const [statusFilter, setStatusFilter] = useState(""); // '', 'online', 'offline'

  // Пагинация
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // 👉 Показывать/скрывать панель фильтров
  const [showFilters, setShowFilters] = useState(true);

  // Константы
  const roles = ["admin", "doctor", "patient"];
  const ageBuckets = [
    { key: "lt18", label: "under 18", from: 0, to: 17 },
    { key: "18_29", label: "18 - 29", from: 18, to: 29 },
    { key: "30_45", label: "30 - 45", from: 30, to: 45 },
    { key: "46_59", label: "46 - 59", from: 46, to: 59 },
    { key: "ge60", label: "over 60", from: 60, to: 200 },
  ];

  // ---------- helpers ----------
  const norm = (v) => (v ? String(v).toLowerCase().trim() : "");
  const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(" ");

  const calcAge = (dob) => {
    if (!dob) return null;
    const b = new Date(dob);
    if (Number.isNaN(b.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const inAgeBucket = (age, key) => {
    if (!key || age == null) return true;
    const b = ageBuckets.find((x) => x.key === key);
    if (!b) return true;
    return age >= b.from && age <= b.to;
  };

  // определяем пол из gender или bio (мультиязычно)
  const genderOf = (u) => {
    const g = norm(u?.gender);
    if (g === "male" || g === "female") return g;

    const b = norm(u?.bio);
    const isFemale = [
      "female",
      "woman",
      "жен",
      "женщина",
      "qadin",
      "qadın",
      "kadin",
      "kadın",
      "girl",
      "qız",
      "kız",
    ].includes(b);
    const isMale = [
      "male",
      "man",
      "муж",
      "мужчина",
      "kişi",
      "kisi",
      "erkek",
      "boy",
      "oğlan",
      "oglan",
    ].includes(b);

    if (isFemale) return "female";
    if (isMale) return "male";
    return "";
  };

  // ---------- загрузка и автообновление списка ----------
  const pollRef = useRef(null);

  const fetchUsers = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.get(`${API_BASE}/admin/user/users-list`);
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    // авто-обновление каждые 30 сек
    pollRef.current = setInterval(fetchUsers, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ---------- heartbeat ----------
  useEffect(() => {
    let t;
    const ping = async () => {
      try {
        axios.defaults.withCredentials = true;
        await axios.post(`${API_BASE}/presence/heartbeat`);
      } catch (e) {}
    };
    ping();
    t = setInterval(ping, 60_000);
    return () => clearInterval(t);
  }, []);

  // ---------- debounce поиска ----------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // При смене фильтров — сброс на 1 страницу
  useEffect(() => {
    setPage(1);
  }, [
    debouncedQuery,
    genderFilter,
    roleFilter,
    ageFilter,
    pageSize,
    countryFilter,
    statusFilter,
  ]);

  // Доступные страны (уникальные)
  const countryOptions = useMemo(() => {
    const set = new Set();
    users.forEach((u) => {
      const c = (u?.country ?? "").toString().trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [users]);

  // Поиск + фильтры
  const filteredUsers = useMemo(() => {
    const q = norm(debouncedQuery);
    return users.filter((user) => {
      const passText =
        !q ||
        norm(fullName(user)).includes(q) ||
        norm(user?.username).includes(q) ||
        norm(user?.email).includes(q) ||
        norm(user?.country).includes(q);

      if (!passText) return false;

      const passGender = !genderFilter || genderOf(user) === genderFilter;
      const passRole = !roleFilter || norm(user?.role) === norm(roleFilter);
      const age = calcAge(user?.dateOfBirth);
      const passAge = inAgeBucket(age, ageFilter);
      const passCountry =
        !countryFilter || norm(user?.country) === norm(countryFilter);

      const st = norm(user?.status);
      const passStatus =
        !statusFilter ||
        (statusFilter === "online" && st === "online") ||
        (statusFilter === "offline" && st !== "online");

      return passGender && passRole && passAge && passCountry && passStatus;
    });
  }, [
    users,
    debouncedQuery,
    genderFilter,
    roleFilter,
    ageFilter,
    countryFilter,
    statusFilter,
  ]);

  // Пагинация
  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageRows = filteredUsers.slice(startIdx, endIdx);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const show = new Set([
      1,
      2,
      totalPages - 1,
      totalPages,
      currentPage - 1,
      currentPage,
      currentPage + 1,
    ]);
    const out = [];
    let prev = 0;
    for (let i = 1; i <= totalPages; i++) {
      if (show.has(i)) {
        if (prev && i - prev > 1) out.push("…");
        out.push(i);
        prev = i;
      }
    }
    return out;
  };

  // Сколько фильтров активно (для бейджа на кнопке)
  const activeFiltersCount =
    (genderFilter ? 1 : 0) +
    (roleFilter ? 1 : 0) +
    (ageFilter ? 1 : 0) +
    (countryFilter ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="users-page">
      <style>{`
        .users-page { background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); padding: 16px; }
        .card { border: 0; border-radius: 16px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); overflow: hidden; }
        .card-title { font-weight: 700; letter-spacing: .2px; }
        .search-wrap { position: relative; width: 100%; max-width: 560px; }
        .search-wrap input { border-radius: 14px; padding: 12px 44px; border: 1px solid #e5e7eb; background: #fff; width: 100%; transition: box-shadow .2s, border-color .2s; outline: none; }
        .search-wrap input:focus { border-color: #94a3b8; box-shadow: 0 0 0 4px rgba(59,130,246,.15); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); opacity: .6; font-size: 18px; }
        .add-btn { border-radius: 12px; padding: 10px 14px; font-weight: 600; box-shadow: 0 6px 16px rgba(2,132,199,0.2); }

        thead.table-head-sticky th { position: sticky; top: 0; z-index: 2; background: #f1f5f9 !important; }
        thead th { font-size: 12px; text-transform: uppercase; letter-spacing: .6px; color: #0f172a; border-bottom: 1px solid #e2e8f0 !important; }
        tbody td, tbody th { vertical-align: middle; font-size: 12px; color: #0f172a; }
        tbody tr { transition: background-color .15s ease-in-out; }
        tbody tr:hover { background: #f8fafc; }
        .badge-role { background: #e2e8f0; color: #0f172a; font-size: 10px; font-weight: 700; border-radius: 999px; padding: 6px 10px; }
        .table-actions a { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; transition: background .15s, transform .1s; }
        .table-actions a:hover { background: #eef2ff; transform: translateY(-1px); }
        .gender-icon { display: inline-flex; width: 28px; height: 28px; border-radius: 50%; align-items: center; justify-content: center; background: #f1f5f9; }
        .mini { font-size: 11px; color: #64748b; }

        .sidebar-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
        .pill-col { display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        @media (min-width: 1400px) { .pill-col { grid-template-columns: 1fr; } }
        .pill-btn { border: 1px solid #e5e7eb; background: #fff; color: #0f172a; border-radius: 999px; padding: 8px 12px; font-size: 12px; font-weight: 600; transition: all .15s; text-transform: capitalize; }
        .pill-btn:hover, .pill-btn.active { background: #0ea5e9; border-color: #0ea5e9; color: #fff; }

        .pager { display: flex; gap: 8px; align-items: center; }
        .pager .btn { border-radius: 10px; }
        .page-chip { min-width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; padding:0 10px; }
        .page-chip.active { background:#0ea5e9; border-color:#0ea5e9; color:#fff; box-shadow: 0 4px 12px rgba(14,165,233,.25); }
        .rows-select { border-radius: 10px; padding: 6px 10px; border: 1px solid #e5e7eb; background:#fff; font-size:12px; }

        .status-pill { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:700; }
        .status-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }

        /* горизонтальный скролл на узких экранах */
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .table-responsive table { min-width: 980px; }
      `}</style>

      {/* Верхняя панель: поиск + кнопка скрыть/показать фильтры */}
      <div className="row mb-3">
        <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="search-wrap">
            <span className="search-icon">🔎</span>
            <input
              type="text"
              name="query"
              placeholder="Search for users (name / username / email / country)"
              title="Enter search keyword"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`btn ${
              showFilters ? "btn-outline-secondary" : "btn-primary"
            }`}
            onClick={() => setShowFilters((v) => !v)}
            style={{ borderRadius: 12, fontWeight: 600 }}
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            {showFilters ? "Hide filters" : "Show filters"}
            {activeFiltersCount > 0 && (
              <span
                className={`badge ms-2 ${
                  showFilters ? "text-bg-secondary" : "text-bg-light text-dark"
                }`}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <section className="section dashboard" style={{ marginLeft: "-10px" }}>
        <div className="row g-3">
          {/* Таблица */}
          <div className={showFilters ? "col-md-10" : "col-12"}>
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title m-0">List of Registered Users</h5>
                  <span className="mini">
                    Showing{" "}
                    <strong>
                      {total ? (page - 1) * pageSize + 1 : 0}-
                      {Math.min(page * pageSize, total)}
                    </strong>{" "}
                    of <strong>{total}</strong>
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-head-sticky">
                      <tr>
                        <th scope="col">№</th>
                        <th scope="col" title="Username">
                          <PiFolderUserBold />
                        </th>
                        <th scope="col" title="Name">
                          <FaUser />
                        </th>
                        <th scope="col">Age</th>
                        <th scope="col" title="Role">
                          <FaTheaterMasks />
                        </th>
                        <th scope="col" title="Status">
                          Status
                        </th>
                        <th scope="col" title="Country">
                          Country
                        </th>
                        <th scope="col" title="Email">
                          <AiTwotoneMail />
                        </th>
                        <th scope="col" title="Registered">
                          <MdAppRegistration />
                        </th>
                        <th scope="col" title="Block/Unblock">
                          <TbLockAccess />
                        </th>
                        <th scope="col" title="Delete">
                          <RiDeleteBin2Fill />
                        </th>
                        <th scope="col" title="Gender">
                          <ImManWoman />
                        </th>
                        <th title="Last Active">🕓Last Active</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageRows.length > 0 ? (
                        pageRows.map((user, index) => {
                          const g = genderOf(user);
                          return (
                            <tr key={user._id}>
                              <th scope="row" style={{ fontSize: "12px" }}>
                                {(page - 1) * pageSize + index + 1}
                              </th>

                              <td style={{ fontSize: "12px", maxWidth: 160 }}>
                                <Link
                                  target="blank"
                                  to={
                                    user.role === "doctor"
                                      ? `/admin/user-detail/${user._id}`
                                      : user.role === "patient"
                                      ? `/admin/user-patient-detail/${user._id}`
                                      : `/admin/user-detail/${user._id}`
                                  }
                                  style={{
                                    textDecoration: "none",
                                    fontWeight: 600,
                                  }}
                                >
                                  {user.username || "Not specified"}
                                </Link>
                                <div className="mini">
                                  ID:&nbsp;
                                  <span style={{ opacity: 0.8 }}>
                                    {user._id?.slice(-6)}
                                  </span>
                                </div>
                              </td>

                              <td style={{ fontSize: "12px", maxWidth: 220 }}>
                                <Link
                                  target="blank"
                                  to={`/admin/user-detail/${user._id}`}
                                  style={{
                                    textDecoration: "none",
                                    color: "#0f172a",
                                  }}
                                >
                                  {(user.firstName || "Not specified") +
                                    " " +
                                    (user.lastName || "")}
                                </Link>
                              </td>

                              <td
                                style={{ fontSize: "12px" }}
                                title={
                                  user.dateOfBirth
                                    ? new Date(
                                        user.dateOfBirth
                                      ).toLocaleDateString()
                                    : ""
                                }
                              >
                                {calcAge(user.dateOfBirth) ?? "—"}
                              </td>

                              <td style={{ fontSize: "12px" }}>
                                <span className="badge-role">
                                  {user.role || "Not specified"}
                                </span>
                                <Link
                                  target="blank"
                                  to={`/admin/users-role-update/${user._id}`}
                                  className="ms-2 table-actions"
                                  title="Change role"
                                  style={{ color: "#334155" }}
                                >
                                  <FaExchangeAlt />
                                </Link>
                              </td>

                              <td>
                                <StatusBadge value={user.status} />
                              </td>

                              <td style={{ fontSize: "12px" }}>
                                {user.country || "Not specified"}
                              </td>

                              <td style={{ fontSize: "12px" }}>
                                {user.email || "Not specified"}
                              </td>

                              <td>
                                <span className="mini">
                                  {user.createdAt
                                    ? new Date(
                                        user.createdAt
                                      ).toLocaleDateString()
                                    : "Not specified"}
                                </span>
                              </td>

                              <td
                                className="table-actions"
                                style={{ fontSize: 18 }}
                              >
                                <Link
                                  target="blank"
                                  to={`/admin/block-user/${user._id}`}
                                  title={
                                    user.isBlocked === true
                                      ? "Unblock"
                                      : "Block"
                                  }
                                  style={{
                                    color: user.isBlocked
                                      ? "#ef4444"
                                      : "#16a34a",
                                  }}
                                >
                                  {user.isBlocked === true ? (
                                    <TbLockOff />
                                  ) : (
                                    <TbLockOpen2 />
                                  )}
                                </Link>
                              </td>

                              <td
                                className="table-actions"
                                style={{ fontSize: 18 }}
                              >
                                <Link
                                  target="blank"
                                  to={`/admin/delete-user/${user._id}`}
                                  title="Delete user"
                                  style={{ color: "#7c3aed" }}
                                >
                                  <RiDeleteBin2Fill />
                                </Link>
                              </td>

                              <td>
                                <span className="gender-icon" title="Gender">
                                  {g === "female" ? (
                                    <ImWoman />
                                  ) : (
                                    <IoManOutline />
                                  )}
                                </span>
                              </td>
                              <td>
                                {user.lastActive
                                  ? new Date(user.lastActive).toLocaleString()
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="12"
                            style={{ textAlign: "center", padding: "24px" }}
                          >
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  total={total}
                  page={currentPage}
                  pageSize={pageSize}
                  totalPages={totalPages}
                  onFirst={() => setPage(1)}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  onLast={() => setPage(totalPages)}
                  onPage={(p) => setPage(p)}
                  pageNumbers={getPageNumbers()}
                  onChangePageSize={(n) => setPageSize(n)}
                />
              </div>
            </div>
          </div>

          {/* Боковая панель с фильтрами (можно скрыть) */}
          {showFilters && (
            <div className="col-md-2">
              <div className="card sidebar-card">
                <div className="card-body">
                  <div className="sidebar-title">Filters</div>

                  <button
                    className="btn btn-light w-100"
                    onClick={() => {
                      setGenderFilter("");
                      setRoleFilter("");
                      setAgeFilter("");
                      setCountryFilter("");
                      setStatusFilter("");
                      setSearchQuery("");
                    }}
                  >
                    Reset filters
                  </button>

                  <FilterGroup title="Role">
                    <Pill
                      active={roleFilter === ""}
                      onClick={() => setRoleFilter("")}
                      label="All"
                    />
                    {roles.map((r) => (
                      <Pill
                        key={r}
                        active={roleFilter === r}
                        onClick={() => setRoleFilter(r)}
                        label={r}
                      />
                    ))}
                  </FilterGroup>

                  <FilterGroup title="Gender">
                    <Pill
                      active={genderFilter === ""}
                      onClick={() => setGenderFilter("")}
                      label="All"
                    />
                    <Pill
                      active={genderFilter === "male"}
                      onClick={() => setGenderFilter("male")}
                      label="men"
                    />
                    <Pill
                      active={genderFilter === "female"}
                      onClick={() => setGenderFilter("female")}
                      label="women"
                    />
                  </FilterGroup>

                  <FilterGroup title="Age">
                    <Pill
                      active={ageFilter === ""}
                      onClick={() => setAgeFilter("")}
                      label="All"
                    />
                    {ageBuckets.map((b) => (
                      <Pill
                        key={b.key}
                        active={ageFilter === b.key}
                        onClick={() => setAgeFilter(b.key)}
                        label={b.label}
                      />
                    ))}
                  </FilterGroup>

                  <FilterGroup title="Country">
                    <select
                      className="rows-select w-100"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                    >
                      <option value="">All</option>
                      {countryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </FilterGroup>

                  <FilterGroup title="Status">
                    <Pill
                      active={statusFilter === ""}
                      onClick={() => setStatusFilter("")}
                      label="All"
                    />
                    <Pill
                      active={statusFilter === "online"}
                      onClick={() => setStatusFilter("online")}
                      label="online"
                    />
                    <Pill
                      active={statusFilter === "offline"}
                      onClick={() => setStatusFilter("offline")}
                      label="offline"
                    />
                  </FilterGroup>
                </div>
              </div>
            </div>
          )}
          {/* /Sidebar */}
        </div>
      </section>
    </div>
  );
};

/* --------- маленькие UI-helpers --------- */
const FilterGroup = ({ title, children }) => (
  <div className="mb-3">
    <div className="mini mb-1">{title}</div>
    <div className="pill-col">{children}</div>
  </div>
);

const Pill = ({ active, onClick, label }) => (
  <button
    type="button"
    className={`pill-btn ${active ? "active" : ""}`}
    onClick={onClick}
    style={{ textTransform: "none" }}
  >
    {label}
  </button>
);

const Pagination = ({
  total,
  page,
  pageSize,
  totalPages,
  onFirst,
  onPrev,
  onNext,
  onLast,
  onPage,
  pageNumbers,
  onChangePageSize,
}) => (
  <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
    <div className="d-flex align-items-center gap-2">
      <span className="mini">Rows per page:</span>
      <select
        className="rows-select"
        value={pageSize}
        onChange={(e) => onChangePageSize(Number(e.target.value))}
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <span className="mini">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>
    </div>

    <div className="pager">
      <button
        className="btn btn-light btn-sm"
        disabled={page <= 1}
        onClick={onFirst}
      >
        &laquo;
      </button>
      <button
        className="btn btn-light btn-sm"
        disabled={page <= 1}
        onClick={onPrev}
      >
        Prev
      </button>

      {pageNumbers.map((p, idx) =>
        p === "…" ? (
          <span key={`dots-${idx}`} className="page-chip" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            className={`page-chip ${page === p ? "active" : ""}`}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        className="btn btn-light btn-sm"
        disabled={page >= totalPages}
        onClick={onNext}
      >
        Next
      </button>
      <button
        className="btn btn-light btn-sm"
        disabled={page >= totalPages}
        onClick={onLast}
      >
        &raquo;
      </button>
    </div>
  </div>
);

/* ---------- Бейдж статуса ---------- */
const StatusBadge = ({ value }) => {
  const v = (value || "offline").toLowerCase();
  const map = {
    online: { bg: "#dcfce7", dot: "#16a34a", txt: "#065f46", label: "online" },
    away: { bg: "#fef9c3", dot: "#ca8a04", txt: "#78350f", label: "away" },
    offline: {
      bg: "#e2e8f0",
      dot: "#64748b",
      txt: "#0f172a",
      label: "offline",
    },
    invisible: {
      bg: "#e9d5ff",
      dot: "#7c3aed",
      txt: "#4c1d95",
      label: "invisible",
    },
  };
  const s = map[v] || map.offline;
  return (
    <span
      className="status-pill"
      style={{ background: s.bg, color: s.txt }}
      title={`User is ${s.label}`}
    >
      <span className="status-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
};

export default UsersList;
