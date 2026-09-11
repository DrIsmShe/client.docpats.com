// client/src/components/adminComponents/aside.jsx
//
// Боковое меню админки. Разделы складываются по щелчку на заголовке.
//
// ЗАЧЕМ. Пунктов в меню под сорок, в тринадцати разделах, и список не
// помещается на экран целиком: до «Данных» внизу нужно прокрутить всё
// остальное. Свернув ненужное, администратор видит то, чем занят.
//
// ПОЧЕМУ НЕ ПЕРЕПИСАНО В МАССИВ. Разметка ниже — плоский список из
// заголовков и пунктов, и у каждого стоит data-sec с именем раздела.
// Этого достаточно: складывание делается ОБХОДОМ детей, а сама разметка
// остаётся такой, какой была, — с комментариями, объясняющими, почему
// тот или иной пункт вынесен отдельным разделом. Перевод в массив
// объектов стоил бы этих комментариев и породил бы 400 строк разницы
// там, где нужно тринадцать состояний.
//
// ЧТО ЗАПОМИНАЕТСЯ. Список ЗАКРЫТЫХ разделов, а не открытых: раздел,
// добавленный завтра, должен быть виден сразу, а не оказаться свёрнутым
// у всех, кто открывал меню раньше. Хранится в localStorage — это
// удобство одного человека на одном браузере, а не состояние, которое
// кому-то ещё нужно знать.
//
// РАЗДЕЛ С ТЕКУЩЕЙ СТРАНИЦЕЙ ОТКРЫТ ВСЕГДА. Иначе, перейдя по прямой
// ссылке в свёрнутый раздел, администратор видел бы меню без единого
// признака того, где он находится.

import React, { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ПАМЯТЬ = "docpats.admin.aside.closed";

/* Чтение памяти не должно ронять меню: приватное окно, запрет на
   хранилище, чужая строка в ключе — всё это возвращает «ничего не
   свёрнуто», а не белый экран. */
function прочитатьЗакрытые() {
  try {
    const сырое = window.localStorage.getItem(ПАМЯТЬ);
    const список = сырое ? JSON.parse(сырое) : [];
    return new Set(Array.isArray(список) ? список : []);
  } catch {
    return new Set();
  }
}

const СТИЛИ = `
/* flex:1, а не width:100%: заголовок раздела сам по себе флекс-строка с
   цветной полоской через ::before, и кнопка шириной во все сто процентов
   выдавила бы полоску за край. min-width:0 нужен, чтобы длинное название
   переносилось, а не растягивало меню. */
.adm-sec-head{display:flex;align-items:center;gap:8px;flex:1;min-width:0;cursor:pointer;
  user-select:none;background:none;border:0;text-align:inherit;font:inherit;color:inherit;
  padding:0}
.adm-sec-head:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:4px}
.adm-sec-caret{margin-inline-start:auto;flex:none;transition:transform .15s;opacity:.65;
  font-size:11px;line-height:1}
/* Страховка на случай, если тема однажды задаст display пунктам меню:
   тогда встроенный смысл hidden перестал бы работать молча, и свёрнутый
   раздел остался бы на экране. */
.sidebar-nav li[hidden]{display:none!important}
.adm-sec-head[aria-expanded="false"] .adm-sec-caret{transform:rotate(-90deg)}
[dir="rtl"] .adm-sec-head[aria-expanded="false"] .adm-sec-caret{transform:rotate(90deg)}
`;

/**
 * Обход плоского списка: заголовки становятся переключателями, пункты
 * закрытых разделов скрываются.
 *
 * Работает по data-sec, который уже стоит у каждого <li>. Элемент без
 * data-sec проходит насквозь нетронутым — так ведут себя разделители и
 * всё, что появится здесь позже и не будет частью раздела.
 */
function Разделы({ children, закрытые, переключить, сегмент }) {
  /* Первый проход — найти раздел, в котором лежит открытая страница.
     Второй проход рисует; разделить их обязательно, потому что заголовок
     раздела идёт ПЕРЕД своими пунктами, и на момент его отрисовки ещё
     неизвестно, есть ли среди них текущая страница. */
  let активный = null;
  React.Children.forEach(children, (ребёнок) => {
    if (активный || !React.isValidElement(ребёнок)) return;
    const раздел = ребёнок.props["data-sec"];
    if (!раздел) return;
    const ссылка = React.Children.toArray(ребёнок.props.children).find(
      (в) => React.isValidElement(в) && typeof в.props?.to === "string",
    );
    if (!ссылка) return;
    const адрес = ссылка.props.to.replace(/^\/+|\/+$/g, "");
    if (адрес && адрес === сегмент) активный = раздел;
  });

  return React.Children.map(children, (ребёнок) => {
    if (!React.isValidElement(ребёнок)) return ребёнок;

    const раздел = ребёнок.props["data-sec"];
    if (!раздел) return ребёнок;

    const классы = String(ребёнок.props.className || "");
    // Раздел с текущей страницей не сворачиваем, даже если он в памяти
    // помечен закрытым: иначе переход по прямой ссылке оставил бы меню
    // без единого признака того, где человек находится.
    const открыт = !закрытые.has(раздел) || раздел === активный;

    if (классы.includes("nav-heading")) {
      return React.cloneElement(ребёнок, {
        children: (
          <button
            type="button"
            className="adm-sec-head"
            aria-expanded={открыт}
            onClick={() => переключить(раздел)}
          >
            <span>{ребёнок.props.children}</span>
            <span className="adm-sec-caret" aria-hidden="true">
              ▾
            </span>
          </button>
        ),
      });
    }

    /* hidden, а не отсутствие в дереве: пункт остаётся смонтированным, и
       раскрытие не пересобирает половину меню. Атрибут же убирает его и
       из показа, и из обхода с клавиатуры. */
    return открыт ? ребёнок : React.cloneElement(ребёнок, { hidden: true });
  });
}

export default function Aside() {
  const isOpen = useSelector((state) => state.menu.isOpen);
  const location = useLocation();
  const [закрытые, setЗакрытые] = useState(прочитатьЗакрытые);

  /* Последний сегмент адреса — по нему ищется ссылка на текущую
     страницу. Таблицы «адрес → раздел» нет намеренно: она была бы
     четвёртым местом, где перечислены все пункты меню, и разъехалась бы
     с разметкой при первом же переименовании маршрута. */
  const текущийСегмент = useMemo(
    () => location.pathname.split("/").filter(Boolean).pop() || "",
    [location.pathname],
  );

  const переключить = useCallback((раздел) => {
    setЗакрытые((прежние) => {
      const следующие = new Set(прежние);
      if (следующие.has(раздел)) следующие.delete(раздел);
      else следующие.add(раздел);
      try {
        window.localStorage.setItem(ПАМЯТЬ, JSON.stringify([...следующие]));
      } catch {
        /* Записать не удалось — складывание всё равно работает, просто не
           переживёт перезагрузку. Это не повод ломать щелчок. */
      }
      return следующие;
    });
  }, []);

  return (
    <div>
      <style>{СТИЛИ}</style>
      <aside
        id={isOpen ? "sidebar-hidden open" : "sidebar-hidden"}
        className={isOpen ? "sidebar open" : "sidebar"}
      >
        <ul id="sidebar-nav" className="sidebar-nav">
          <Разделы
            закрытые={закрытые}
            переключить={переключить}
            сегмент={текущийСегмент}
          >
          {/* ─── Обзор ─── */}
          <li className="nav-heading" data-sec="overview">Обзор</li>
          <li className="nav-item" data-sec="overview">
            <Link className="nav-link collapsed" to="overview">
              <i className="bi bi-speedometer2"></i>
              <span>Обзор платформы</span>
            </Link>
          </li>
          {/* Посещаемость: чем из построенного пользуются. Не путать с
              «Аналитикой арены» — та про успеваемость в кейсах. */}
          <li className="nav-item" data-sec="overview">
            <Link className="nav-link collapsed" to="analytics">
              <i className="bi bi-bar-chart-line"></i>
              <span>Посещаемость</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="overview">
            <Link className="nav-link collapsed" to="system">
              <i className="bi bi-hdd-network"></i>
              <span>Статус системы</span>
            </Link>
          </li>
          {/* Тексты для пользователей: что написано и что отстало по языкам.
              Не привязано к модулю — корпус описывает платформу целиком. */}
          <li className="nav-item" data-sec="overview">
            <Link className="nav-link collapsed" to="docs">
              <i className="bi bi-journal-text"></i>
              <span>Документация</span>
            </Link>
          </li>

          {/* ─── Клиники ─── */}
          <li className="nav-heading" data-sec="clinics">Клиники</li>
          <li className="nav-item" data-sec="clinics">
            <Link className="nav-link collapsed" to="clinics">
              <i className="bi bi-hospital"></i>
              <span>Клиники</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="clinics">
            <Link className="nav-link collapsed" to="features">
              <i className="bi bi-toggles"></i>
              <span>Фичи клиник</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="clinics">
            <Link className="nav-link collapsed" to="reviews">
              <i className="bi bi-star"></i>
              <span>Отзывы</span>
            </Link>
          </li>

          {/* ─── Движок новостей ─── */}
          <li className="nav-heading" data-sec="news-engine">Движок новостей</li>
          <li className="nav-item" data-sec="news-engine">
            <Link className="nav-link collapsed" to="news-engine">
              <i className="bi bi-toggles"></i>
              <span>Генерация и перевод</span>
            </Link>
          </li>

          {/* ─── Конференции ─── */}
          <li className="nav-heading" data-sec="conferences">Конференции</li>
          <li className="nav-item" data-sec="conferences">
            <Link className="nav-link collapsed" to="conferences">
              <i className="bi bi-calendar-event"></i>
              <span>Модерация конференций</span>
            </Link>
          </li>

          {/* ─── Тесты и экзамены ─── */}
          <li className="nav-heading" data-sec="education">Тесты и экзамены</li>
          <li className="nav-item" data-sec="education">
            <Link className="nav-link collapsed" to="education-programs">
              <i className="bi bi-journal-check"></i>
              <span>Тесты</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="education">
            <Link className="nav-link collapsed" to="education-categories">
              <i className="bi bi-diagram-3"></i>
              <span>Категории тестов</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="education">
            <Link className="nav-link collapsed" to="education-import">
              <i className="bi bi-file-earmark-arrow-up"></i>
              <span>Загрузить тест из файла</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="education">
            <Link className="nav-link collapsed" to="education-review">
              <i className="bi bi-clipboard-check"></i>
              <span>Ревью вопросов</span>
            </Link>
          </li>

          {/* ─── Диагностическая арена ─── */}
          {/* Раздел давно шире лучевой диагностики: снимки — лишь одна из трёх
              станций, рядом «Анализы», «Виртуальный пациент» и аналитика.
              «Диагностическая арена» — то же имя, под которым продукт уже
              приходит врачу в уведомлениях (jobs/radiologyWeeklyCase.job.js). */}
          <li className="nav-heading" data-sec="radiology">Диагностическая арена</li>
          <li className="nav-item" data-sec="radiology">
            <Link className="nav-link collapsed" to="radiology">
              <i className="bi bi-lungs"></i>
              <span>Кейсы чтения снимков</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="radiology">
            <Link className="nav-link collapsed" to="labs">
              <i className="bi bi-clipboard-data"></i>
              <span>Кейсы: анализы</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="radiology">
            <Link className="nav-link collapsed" to="vp">
              <i className="bi bi-person-vcard"></i>
              <span>Виртуальный пациент</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="radiology">
            <Link className="nav-link collapsed" to="arena-analytics">
              <i className="bi bi-graph-up"></i>
              <span>Аналитика арены</span>
            </Link>
          </li>

          {/* ─── DP-Tube ───
              Витрина роликов: каталог, полки и разбор жалоб. Отдельной
              секцией, а не пунктом в «Обзоре»: это три разных занятия —
              править материал, раскладывать его по полкам и отвечать на
              заявления людей, — и делают их в разное время. */}
          <li className="nav-heading" data-sec="dptube">Управление DP-Tube</li>
          <li className="nav-item" data-sec="dptube">
            <Link className="nav-link collapsed" to="videos">
              <i className="bi bi-collection-play"></i>
              <span>Каталог роликов</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="dptube">
            <Link className="nav-link collapsed" to="video-categories">
              <i className="bi bi-tags"></i>
              <span>Разделы витрины</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="dptube">
            <Link className="nav-link collapsed" to="video-reports">
              <i className="bi bi-flag"></i>
              <span>Жалобы на материалы</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="dptube">
            {/* Витрина глазами посетителя — открывается в новой вкладке:
                уходить из панели разбора ради проверки не нужно. */}
            <a
              className="nav-link collapsed"
              href="/videos"
              target="_blank"
              rel="noreferrer"
            >
              <i className="bi bi-box-arrow-up-right"></i>
              <span>Открыть витрину</span>
            </a>
          </li>

          {/* ─── Обратная связь ───
              Отдельной секцией, а не пунктом в «Обзоре»: это ежедневная
              очередь, в которую заходят отвечать, а не смотреть цифры. */}
          {/* ─── Модели ИИ ───
              Одно место, где решается, чем платформа думает: провайдер по
              умолчанию и переопределения по частям проекта. */}
          <li className="nav-heading" data-sec="ai">Искусственный интеллект</li>
          <li className="nav-item" data-sec="ai">
            <Link className="nav-link collapsed" to="ai">
              <i className="bi bi-cpu"></i>
              <span>Модели ИИ</span>
            </Link>
          </li>

          <li className="nav-heading" data-sec="feedback">Обратная связь</li>
          <li className="nav-item" data-sec="feedback">
            <Link className="nav-link collapsed" to="feedback">
              <i className="bi bi-chat-left-text"></i>
              <span>Обращения</span>
            </Link>
          </li>

          {/* ─── Тарифы и оплата ─── */}
          <li className="nav-heading" data-sec="billing">Тарифы</li>
          <li className="nav-item" data-sec="billing">
            <Link className="nav-link collapsed" to="billing">
              <i className="bi bi-credit-card"></i>
              <span>Тарифы и заявки</span>
            </Link>
          </li>

          {/* ─── Пользователи и врачи ─── */}
          <li className="nav-heading" data-sec="users">Пользователи</li>
          <li className="nav-item" data-sec="users">
            <Link className="nav-link collapsed" to="users-list">
              <i className="bi bi-people"></i>
              <span>Все пользователи</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="users">
            <Link className="nav-link collapsed" to="doctors">
              <i className="bi bi-person-badge"></i>
              <span>Врачи и приёмы</span>
            </Link>
          </li>
          {/* Пункт выше — обзор: сводка приёмов и рассылка уведомлений.
              Завести врача и поправить карточку можно только здесь. */}
          <li className="nav-item" data-sec="users">
            <Link className="nav-link collapsed" to="doctors-manage">
              <i className="bi bi-person-plus"></i>
              <span>Профили врачей</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="users">
            <Link className="nav-link collapsed" to="verification">
              <i className="bi bi-patch-check"></i>
              <span>Верификация врачей</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="users">
            <Link className="nav-link collapsed" to="polyclinic/get-all">
              <i className="bi bi-clipboard2-pulse"></i>
              <span>Поликлиника</span>
            </Link>
          </li>

          {/* ─── Безопасность ─── */}
          <li className="nav-heading" data-sec="security">Безопасность</li>
          <li className="nav-item" data-sec="security">
            <Link className="nav-link collapsed" to="security">
              <i className="bi bi-shield-exclamation"></i>
              <span>Дашборд безопасности</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="security">
            <Link className="nav-link collapsed" to="audit-log">
              <i className="bi bi-shield-lock"></i>
              <span>Аудит-лог</span>
            </Link>
          </li>

          {/* ─── Данные ─── */}
          <li className="nav-heading" data-sec="data">Данные</li>
          <li className="nav-item" data-sec="data">
            <Link className="nav-link collapsed" to="database">
              <i className="bi bi-bar-chart-line"></i>
              <span>База данных (аналитика)</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="data">
            <Link className="nav-link collapsed" to="create-categories-of-my-articles">
              <i className="bi bi-tags"></i>
              <span>Категории статей</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="data">
            <Link className="nav-link collapsed" to="mongodb-database">
              <i className="bi bi-download"></i>
              <span>Экспорт БД</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="data">
            <Link className="nav-link collapsed" to="mongodb-database-import">
              <i className="bi bi-upload"></i>
              <span>Импорт БД</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="data">
            <Link className="nav-link collapsed" to="mongodb">
              <i className="bi bi-download"></i>
              <span>Экспорт коллекций</span>
            </Link>
          </li>
          <li className="nav-item" data-sec="data">
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
          </Разделы>
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
