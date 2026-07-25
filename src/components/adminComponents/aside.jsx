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
          {/* ─── Обзор ─── */}
          <li className="nav-heading">Обзор</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="overview">
              <i className="bi bi-speedometer2"></i>
              <span>Обзор платформы</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="system">
              <i className="bi bi-hdd-network"></i>
              <span>Статус системы</span>
            </Link>
          </li>

          {/* ─── Клиники ─── */}
          <li className="nav-heading">Клиники</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="clinics">
              <i className="bi bi-hospital"></i>
              <span>Клиники</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="features">
              <i className="bi bi-toggles"></i>
              <span>Фичи клиник</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="reviews">
              <i className="bi bi-star"></i>
              <span>Отзывы</span>
            </Link>
          </li>

          {/* ─── Тесты и экзамены ─── */}
          <li className="nav-heading">Тесты и экзамены</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="education-programs">
              <i className="bi bi-journal-check"></i>
              <span>Тесты</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="education-categories">
              <i className="bi bi-diagram-3"></i>
              <span>Категории тестов</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="education-import">
              <i className="bi bi-file-earmark-arrow-up"></i>
              <span>Загрузить тест из файла</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="education-review">
              <i className="bi bi-clipboard-check"></i>
              <span>Ревью вопросов</span>
            </Link>
          </li>

          {/* ─── Лучевая диагностика ─── */}
          <li className="nav-heading">Лучевая диагностика</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="radiology">
              <i className="bi bi-lungs"></i>
              <span>Кейсы чтения снимков</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="labs">
              <i className="bi bi-clipboard-data"></i>
              <span>Кейсы: анализы</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="vp">
              <i className="bi bi-person-vcard"></i>
              <span>Виртуальный пациент</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="arena-analytics">
              <i className="bi bi-graph-up"></i>
              <span>Аналитика арены</span>
            </Link>
          </li>

          {/* ─── Тарифы и оплата ─── */}
          <li className="nav-heading">Тарифы</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="billing">
              <i className="bi bi-credit-card"></i>
              <span>Тарифы и заявки</span>
            </Link>
          </li>

          {/* ─── Пользователи и врачи ─── */}
          <li className="nav-heading">Пользователи</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="users-list">
              <i className="bi bi-people"></i>
              <span>Все пользователи</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="doctors">
              <i className="bi bi-person-badge"></i>
              <span>Врачи и приёмы</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="verification">
              <i className="bi bi-patch-check"></i>
              <span>Верификация врачей</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="polyclinic/get-all">
              <i className="bi bi-clipboard2-pulse"></i>
              <span>Поликлиника</span>
            </Link>
          </li>

          {/* ─── Безопасность ─── */}
          <li className="nav-heading">Безопасность</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="security">
              <i className="bi bi-shield-exclamation"></i>
              <span>Дашборд безопасности</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="audit-log">
              <i className="bi bi-shield-lock"></i>
              <span>Аудит-лог</span>
            </Link>
          </li>

          {/* ─── Данные ─── */}
          <li className="nav-heading">Данные</li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="database">
              <i className="bi bi-bar-chart-line"></i>
              <span>База данных (аналитика)</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="create-categories-of-my-articles">
              <i className="bi bi-tags"></i>
              <span>Категории статей</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="mongodb-database">
              <i className="bi bi-download"></i>
              <span>Экспорт БД</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="mongodb-database-import">
              <i className="bi bi-upload"></i>
              <span>Импорт БД</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="mongodb">
              <i className="bi bi-download"></i>
              <span>Экспорт коллекций</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link collapsed" to="mongodb-database-collection">
              <i className="bi bi-upload"></i>
              <span>Импорт коллекций</span>
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
