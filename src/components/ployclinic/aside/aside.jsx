import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
// Выход: сбросить кэш сессии и разорвать связь событий счётчика с человеком.
import { clearSession } from "../../../api/session";
import { useTranslation } from "react-i18next";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

aside.sidebar {
  background: white !important;
  border-right: 1px solid #dde4ec !important;
  font-family: 'Inter', system-ui, sans-serif !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.aside-dp-header {
  background: linear-gradient(150deg,#094d44 0%,#0d6b5e 60%,#1a7a6e 100%);
  padding: 24px 18px 30px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
.aside-dp-header::before {
  content:''; position:absolute; inset:0;
  background:
    radial-gradient(ellipse 200px 160px at 110% 20%,rgba(20,184,166,.22) 0%,transparent 65%),
    radial-gradient(ellipse 130px 180px at -5% 120%,rgba(4,44,38,.5) 0%,transparent 55%);
  pointer-events:none;
}
.aside-dp-header::after {
  content:''; position:absolute; bottom:-1px; left:0; right:0;
  height:22px; background:white; clip-path:ellipse(56% 100% at 50% 100%);
}
.aside-dp-brand {
  display:inline-flex; align-items:center; gap:6px;
  font-size:9px; font-weight:700; letter-spacing:.13em; text-transform:uppercase;
  color:rgba(255,255,255,.7); background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.18); padding:3px 10px; border-radius:100px;
  margin-bottom:13px; position:relative; z-index:1; backdrop-filter:blur(6px);
}
.aside-dp-brand::before {
  content:''; width:5px; height:5px; background:#5ef4dd; border-radius:50%;
}
.aside-dp-profile-link {
  display:flex !important; align-items:center !important; gap:12px !important;
  text-decoration:none !important; padding:6px 7px !important;
  border-radius:10px !important; transition:all .18s ease !important;
  position:relative; z-index:1;
}
.aside-dp-profile-link:hover { background:rgba(255,255,255,.1) !important; }
.aside-dp-avatar-wrap { position:relative; flex-shrink:0; }
.aside-dp-avatar {
  width:54px !important; height:54px !important;
  border-radius:50% !important; object-fit:cover !important;
  border:2.5px solid rgba(255,255,255,.4) !important;
  box-shadow:0 3px 14px rgba(0,0,0,.2) !important; display:block !important;
}
.aside-dp-ring {
  position:absolute; inset:-4px; border-radius:50%;
  border:2px solid rgba(94,244,221,.35); pointer-events:none;
}
.aside-dp-dot {
  position:absolute; bottom:2px; right:2px;
  width:11px; height:11px; background:#4ade80; border-radius:50%;
  border:2px solid #094d44; box-shadow:0 0 0 2px rgba(74,222,128,.28);
}
.aside-dp-office { font-size:9px !important; font-weight:700 !important; color:rgba(255,255,255,.6) !important; letter-spacing:.07em !important; text-transform:uppercase !important; display:block; margin-bottom:3px; }
.aside-dp-name   { font-size:14px !important; font-weight:700 !important; color:white !important; line-height:1.25 !important; letter-spacing:-.01em !important; }

.aside-dp-nav-body { flex:1; overflow-y:auto; padding:8px 10px 10px; scrollbar-width:thin; scrollbar-color:#c5d0de transparent; }
.aside-dp-nav-body::-webkit-scrollbar { width:4px; }
.aside-dp-nav-body::-webkit-scrollbar-thumb { background:#c5d0de; border-radius:2px; }
.aside-dp-nav-section { font-size:9px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#7089a6; padding:14px 8px 5px; }

ul.sidebar-nav.aside-dp-ul { list-style:none !important; padding:0 !important; margin:0 !important; }
ul.sidebar-nav.aside-dp-ul .nav-item { margin-bottom:2px !important; }
ul.sidebar-nav.aside-dp-ul .nav-link {
  display:flex !important; align-items:center !important; gap:10px !important;
  padding:9px 11px !important; border-radius:9px !important;
  font-size:16px !important; font-weight:500 !important;
  color:#3d4f63 !important; text-decoration:none !important;
  transition:all .18s ease !important; border-left:3px solid transparent !important;
  background:none !important;
}
ul.sidebar-nav.aside-dp-ul .nav-link:hover {
  color:#0d6b5e !important; background:#e8f7f5 !important;
  border-left-color:#a3ddd5 !important;
}
.aside-dp-icon {
  width:30px; height:30px; border-radius:7px;
  background:#f4f7f9; border:1px solid #dde4ec;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; flex-shrink:0; transition:all .18s ease;
}
ul.sidebar-nav.aside-dp-ul .nav-link:hover .aside-dp-icon {
  background:white; border-color:#a3ddd5;
  box-shadow:0 2px 8px rgba(13,107,94,.12);
}

.aside-dp-footer {
  padding:12px 12px 16px; border-top:1px solid #dde4ec;
  background:#f4f7f9; flex-shrink:0;
}
.aside-dp-logout {
  display:flex !important; align-items:center !important;
  justify-content:center !important; gap:7px !important;
  width:100% !important; padding:9px 16px !important;
  border-radius:100px !important; font-size:12px !important;
  font-weight:700 !important; font-family:'Inter',sans-serif !important;
  color:#c0392b !important; background:#fdf1f0 !important;
  border:1.5px solid #f0b8b2 !important;
  cursor:pointer !important; transition:all .18s ease !important;
}
.aside-dp-logout:hover {
  background:#c0392b !important; color:white !important;
  border-color:#c0392b !important;
  box-shadow:0 4px 14px rgba(192,57,43,.28) !important;
  transform:translateY(-1px) !important;
}

.aside-dp-state {
  flex:1; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap:12px; padding:32px; font-size:13px; color:#7089a6;
  font-family:'Inter',sans-serif;
}
.aside-dp-spinner {
  width:26px; height:26px;
  border:2.5px solid #e8f7f5; border-top-color:#0d6b5e;
  border-radius:50%; animation:dpSpin .7s linear infinite;
}
@keyframes dpSpin { to { transform:rotate(360deg); } }
`;

export default function Aside() {
  const { t } = useTranslation();
  const isOpen = useSelector((state) => state.menu.isOpen);
  const { id } = useParams();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");

  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [imagedata, setProfileImagedata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!userId) return;
    const fetchDoctorProfile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/doctor-profile/get-profile-doctor/${userId}`,
          { withCredentials: true },
        );
        const profileImg = response.data.profile?.profileImage;
        const fullImagePath =
          profileImg && profileImg !== "null" && profileImg !== ""
            ? profileImg.startsWith("http")
              ? profileImg
              : `${API_BASE}/${profileImg}`
            : `${API_BASE}/uploads/default.png`;
        setProfileImagedata(fullImagePath);
      } catch (error) {
        setError(t("aside.errors.profileLoad"));
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorProfile();
  }, [userId, t]);

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
          setUserName(response.data.user.username);
          setProfileImage(response.data.user.profileImage);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };
    checkAuthentication();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/auth/logout`,
        {},
        { withCredentials: true },
      );
      clearSession();
      alert(t("aside.logout.success"));
      navigate("/login");
    } catch (error) {
      alert(t("aside.logout.error"));
    }
  };

  if (!isAuthenticated) return null;

  if (loading)
    return (
      <div>
        <style>{CSS}</style>
        <aside
          id={isOpen ? "sidebar-hidden open" : "sidebar-hidden"}
          className={isOpen ? "sidebar open" : "sidebar"}
        >
          <div className="aside-dp-state">
            <div className="aside-dp-spinner" />
            <span>{t("aside.loading")}</span>
          </div>
        </aside>
      </div>
    );

  if (error)
    return (
      <div>
        <style>{CSS}</style>
        <aside
          id={isOpen ? "sidebar-hidden open" : "sidebar-hidden"}
          className={isOpen ? "sidebar open" : "sidebar"}
        >
          <div className="aside-dp-state" style={{ color: "#c0392b" }}>
            {error}
          </div>
        </aside>
      </div>
    );

  return (
    <div>
      <style>{CSS}</style>

      <aside
        id={isOpen ? "sidebar-hidden open" : "sidebar-hidden"}
        className={isOpen ? "sidebar open" : "sidebar"}
      >
        {/* HEADER */}
        <div className="aside-dp-header">
          <div className="aside-dp-brand">DocPats · Doctor Portal</div>
          <Link
            target="_blank"
            className="nav-link nav-profile aside-dp-profile-link"
            to={`/doctor/doctor-profile/${user.userId}`}
          >
            <div className="aside-dp-avatar-wrap">
              <img
                src={imagedata || `${API_BASE}/uploads/default.png`}
                alt="Profile"
                className="aside-dp-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${API_BASE}/uploads/default.png`;
                }}
              />
              <div className="aside-dp-ring" />
              <div className="aside-dp-dot" />
            </div>
            <div>
              <span className="aside-dp-office">{t("aside.officeOf")}</span>
              <div className="aside-dp-name">
                {t("aside.doctor")} {user.firstName}
              </div>
            </div>
          </Link>
        </div>

        {/* NAV */}
        <div className="aside-dp-nav-body">
          <div className="aside-dp-nav-section">
            {t("aside.menu.navigation") || "Navigation"}
          </div>
          <ul id="sidebar-nav" className="sidebar-nav aside-dp-ul">
            <li className="nav-item">
              <Link className="nav-link" to="polyclinic">
                <span className="aside-dp-icon">🏥</span>
                <span>{t("aside.menu.polyclinic")}</span>
              </Link>
            </li>
            {/* <li className="nav-item">
              <Link className="nav-link" to="surgery">
                <span className="aside-dp-icon">🏥</span>
                <span>{t("aside.menu.surgery")}</span>
              </Link>
            </li> */}
            <li className="nav-item">
              <Link className="nav-link" to="/dp/simulation">
                <span className="aside-dp-icon">🏥</span>
                <span>{t("aside.menu.modeling")}</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className="nav-link"
                to={`/doctor/doctor-profile/${user.userId}`}
              >
                <span className="aside-dp-icon">👤</span>
                <span>{t("aside.menu.myProfile")}</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* FOOTER */}
        <div className="aside-dp-footer">
          <button className="aside-dp-logout" onClick={handleLogout}>
            <span>⏻</span>
            {t("aside.logout.button") || "Logout"}
          </button>
        </div>
      </aside>
    </div>
  );
}
