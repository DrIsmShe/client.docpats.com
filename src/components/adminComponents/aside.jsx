import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
export default function Aside() {
  const isOpen = useSelector((state) => state.menu.isOpen);
  return (
    <div>
      <aside
        id={isOpen ? "sidebar-hidden open" : "sidebar-hidden"}
        className={isOpen ? "sidebar open" : "sidebar"}
      >
        <ul id="sidebar-nav" className="sidebar-nav">
          {/* <li className="nav-item">
            <a className="nav-link " href="index.html">
              <i className="bi bi-grid"></i>
              <span>Dashboard</span>
            </a>
          </li> */}
          <li className="nav-item">
            <Link className="nav-link collapsed" to="users-list">
              <i class="bi bi-newspaper"></i>
              <span>Users list</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="polyclinic/get-all">
              <i class="bi bi-newspaper"></i>
              <span>Polyclinic</span>
            </Link>
          </li>
          {/* <li className="nav-item">
            <Link
              className="nav-link collapsed"
              data-bs-target="#tables-nav"
              data-bs-toggle="collapse"
              href="#"
            >
              <i class="bi bi-book-half"></i>
              <span>Books</span>
            </Link>
          </li> */}

          <li className="nav-item">
            <Link
              className="nav-link collapsed"
              to="create-categories-of-my-articles"
            >
              <i class="bi bi-newspaper"></i>
              <span>Create categories</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="mongodb-database">
              <i class="bi bi-newspaper"></i>
              <span>Download DB</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="mongodb-database-import">
              <i class="bi bi-newspaper"></i>
              <span>Import DB</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="mongodb">
              <i class="bi bi-newspaper"></i>
              <span>Download collections</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link collapsed"
              to="mongodb-database-collection"
            >
              <i class="bi bi-newspaper"></i>
              <span>Import collections</span>
            </Link>
          </li>
          {/* <li className="nav-item">
            <Link
              className="nav-link collapsed"
              data-bs-target="#auth-nav"
              data-bs-toggle="collapse"
              href="#"
            >
              <i className="bi bi-menu-button-wide"></i>
              <span>Auth</span>
              <i className="bi bi-chevron-down ms-auto"></i>
            </Link>
            <ul
              id="auth-nav"
              className="nav-content collapse "
              data-bs-parent="#auth-nav"
            >
              <li>
                <Link to="/">
                  <i className="bi bi-circle"></i>
                  <span>Register</span>
                </Link>
              </li>
              <li>
                <Link to="/login">
                  <i className="bi bi-circle"></i>
                  <span>Login</span>
                </Link>
              </li>
              <li>
                <Link to="/confirmationregister">
                  <i className="bi bi-circle"></i>
                  <span>Confirmation of register</span>
                </Link>
              </li>
              <li>
                <Link to="/resetpassword">
                  <i className="bi bi-circle"></i>
                  <span>Reset password</span>
                </Link>
              </li>
              <li>
                <Link to="/resetpasswordchange">
                  <i className="bi bi-circle"></i>
                  <span>Reset password change</span>
                </Link>
              </li>
              <li>
                <Link to="/otpresetpasswordchange">
                  <i className="bi bi-circle"></i>
                  <span>OTP for reset password change</span>
                </Link>
              </li>
            </ul>
          </li> */}

          {/* <li className="nav-item">
            <Link
              className="nav-link collapsed"
              data-bs-target="#components-nav"
              data-bs-toggle="collapse"
              href="#"
            >
              <i class="bi bi-hospital-fill"></i>
              <span>Clinics</span>
            </Link>
          </li> */}
          {/* <li className="nav-item">
            <Link
              className="nav-link collapsed"
              data-bs-target="#components-nav"
              data-bs-toggle="collapse"
              href="#"
            >
              <i class="bi bi-record-circle-fill"></i>
              <span>Medical records</span>
            </Link>
          </li> */}
          {/* <li className="nav-item">
            <Link
              className="nav-link collapsed"
              data-bs-target="#tables-nav"
              data-bs-toggle="collapse"
              href="#"
            >
              <i class="bi bi-youtube"></i>
              <span>DP-Tube</span>
            </Link>
          </li> */}
        </ul>
        {/* <div className="patients">
          <Link to="/polyclinic" target="blank">
            <button
              className="btn btn-primary"
              style={{ width: "60%", marginTop: "10px" }}
            >
              Polyclinic
            </button>
          </Link>
        </div>
        <div className="patients">
          <Link to="/" target="blank">
            <button
              className="btn btn-primary"
              style={{ width: "60%", marginTop: "10px" }}
            >
              Hospital
            </button>
          </Link>
        </div> */}
      </aside>
    </div>
  );
}
