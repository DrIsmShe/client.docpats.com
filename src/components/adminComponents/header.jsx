import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toggleMenu } from "../../slices/menuSlice";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
// Выход: сбросить кэш сессии и разорвать связь событий счётчика с человеком.
import { clearSession } from "../../api/session";
export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });

        if (response.data.authenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);
          setUserName(response.data.user.username);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error checking authentication:", error);
      }
    };

    checkAuthentication();
  }, [API_BASE]);
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
      // eslint-disable-next-line no-console
      console.error("Error logging out:", error);
    }
  };
  if (!isAuthenticated || !user) return null;

  return (
    <div>
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        <div className="d-flex align-items-center justify-content-between">
          <Link
            to="/admin/admin-panel"
            className="logo d-flex align-items-center"
            target="_blank"
          >
            <img
              src={`${process.env.PUBLIC_URL}/logo_docpats_192.png`}
              alt="Docpats Logo"
            />

            <span className="d-none d-lg-block">DOCPATS </span>
          </Link>

          <i
            className="bi bi-list toggle-sidebar-btn"
            onClick={() => dispatch(toggleMenu())}
          ></i>

          <i
            className="toggle-sidebar-btn-hidden bi bi-list "
            onClick={() => dispatch(toggleMenu())}
          ></i>
        </div>

        <div className="search-bar">
          <form
            className="search-form d-flex align-items-center"
            method="POST"
            action="#"
          >
            <input
              type="text"
              name="query"
              placeholder="Search"
              title="Enter search keyword"
            />
            <button type="submit" title="Search">
              <i className="bi bi-search"></i>
            </button>
          </form>
        </div>

        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            <li className="nav-item d-block d-lg-none">
              <Link className="nav-link nav-icon search-bar-toggle " href="#">
                <i className="bi bi-search"></i>
              </Link>
            </li>
            <li className="nav-item dropdown pe-3">
              <Link
                className="nav-link nav-profile d-flex align-items-center pe-0"
                href="#"
                data-bs-toggle="dropdown"
              >
                <img
                  src="assets/img/profile-img.jpg"
                  alt="Profile"
                  className="rounded-circle"
                />
                <span className="d-none d-md-block dropdown-toggle ps-2">
                  Welcome, {user.firstName}
                </span>
              </Link>

              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>
                    {user.firstName} {user.lastName}
                  </h6>
                  <span>Web Designer</span>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link
                    className="dropdown-item d-flex align-items-center"
                    to={`/doctor-profile/${userName}`}
                  >
                    <i className="bi bi-person"></i>
                    <span>My Profile</span>
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link
                    className="dropdown-item d-flex align-items-center"
                    href="users-profile.html"
                  >
                    <i className="bi bi-gear"></i>
                    <span>Account Settings</span>
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link
                    className="dropdown-item d-flex align-items-center"
                    href="pages-faq.html"
                  >
                    <i className="bi bi-question-circle"></i>
                    <span>Need Help?</span>
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link
                    className="dropdown-item d-flex align-items-center"
                    href="#"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span onClick={handleLogout}>Sign Out</span>
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </header>
      <div className="patients-block">
        <div className="patients-block-1">
          <Link to="http://localhost:3001/" target="blank">
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginBottom: "5px" }}
            >
              Polyclinic
            </button>
          </Link>
        </div>
        <div className="patients-block-2">
          <Link to="http://localhost:3001/" target="blank">
            <button className="btn btn-primary" style={{ width: "100%" }}>
              Hospital
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
