// client/src/pages/doctorProfilePages/appointments/DoctorBookingPage.jsx
//
// Отдельная страница «Записать пациента на приём»: календарь месяца слева,
// слоты выбранного дня справа, запись по клику на свободное время.
//
// Зачем отдельно от /doctor/doctor-appointment: та страница — журнал приёмов,
// и календарь на ней спрятан под списком и модальным окном. Регистратурное
// действие «человек стоит рядом, запиши его на четверг» должно открываться
// одной ссылкой из меню и с главной, а не тремя кликами вглубь журнала.
//
// Слоты берутся тем же генератором, что видит пациент
// (GET /schedule/doctor-schedule/day/:date → common/services/daySlots.service.js),
// поэтому занятое здесь время исчезает у пациента, а свободное здесь у него есть.

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import BookPatientModal from "./BookPatientModal.jsx";

const API_BASE = process.env.REACT_APP_API_URL;

/** Дата календаря в "YYYY-MM-DD" по ЛОКАЛЬНОМУ времени.
 *  toISOString() здесь нельзя: полночь по Баку (+04) — это предыдущие сутки
 *  по UTC, и день уезжал бы назад. */
function toLocalYMD(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}

/** Начало сегодняшнего дня по местному времени — граница «прошлого». */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Исход приёма — подписью на слоте. Живые записи (pending/confirmed) в
// карте отсутствуют намеренно: у них исхода ещё нет, и подписывать нечего.
const STATUS_LABEL = {
  completed: { key: "st_completed", ru: "состоялся" },
  cancelled: { key: "st_cancelled", ru: "отменён" },
  no_show: { key: "st_no_show", ru: "не пришёл" },
  refunded: { key: "st_refunded", ru: "возврат" },
};

/** Слот уже прошёл? Пять минут допуска — как и на сервере. */
function isPastSlot(iso) {
  return new Date(iso).getTime() < Date.now() - 5 * 60 * 1000;
}

function timeLabel(iso, timezone) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone || undefined,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleTimeString();
  }
}

const styles = `
  /* box-sizing на своих элементах: тема задаёт его не везде, а без него
     padding прибавляется к 100% ширины и страница уезжает за экран. */
  .bookpage-wrap, .bookpage-wrap * { box-sizing: border-box; }
  .bookpage-wrap {
    padding: 18px;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    /* Последняя защита: что бы ни оказалось шире экрана (чужой виджет,
       длинное имя пациента), горизонтальной прокрутки у страницы не будет. */
    overflow-x: hidden;
  }
  .bookpage-head {
    display: flex; flex-wrap: wrap; gap: 12px;
    align-items: center; justify-content: space-between; margin-bottom: 16px;
  }
  .bookpage-title { font-size: 26px; font-weight: 800; margin: 0; overflow-wrap: anywhere; }
  .bookpage-sub { color: #64748b; font-size: 14px; overflow-wrap: anywhere; }
  .bookpage-grid {
    display: grid; gap: 18px;
    grid-template-columns: minmax(320px, 460px) 1fr;
    align-items: start;
  }
  /* Ячейки грида по умолчанию имеют min-width:auto и НЕ сжимаются меньше
     своего содержимого — именно из-за этого календарь распирал колонку и
     страница вылезала за пределы телефона. */
  .bookpage-grid > * { min-width: 0; }
  @media (max-width: 900px) {
    .bookpage-grid { grid-template-columns: 1fr; }
  }
  .bookpage-slots { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
  .slot-btn {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
    border: 1px solid #a5c8ff; border-radius: 10px; padding: 10px 12px;
    background: linear-gradient(145deg, #e0edff, #d5e4ff); color: #1e3a8a;
    cursor: pointer; text-align: left; transition: transform .12s ease;
  }
  .slot-btn:hover { transform: translateY(-1px); filter: brightness(1.03); }
  .slot-btn.busy {
    background: linear-gradient(145deg, #b6e6a2, #a7d68f);
    border-color: #9fd18e; color: #14532d; cursor: default;
  }
  .slot-btn.busy:hover { transform: none; filter: none; }
  /* Прошедшее время: видно, что слот был, но записать в него нельзя. */
  .slot-btn.past {
    background: #f1f5f9; border-color: #e2e8f0; color: #94a3b8;
    cursor: not-allowed;
  }
  .slot-btn.past:hover { transform: none; filter: none; }
  .slot-time { font-weight: 700; font-size: 15px; }
  .slot-meta { font-size: 12px; opacity: .8; }
  .react-calendar { width: 100%; border: none; border-radius: 14px; padding: 10px; }
  .react-calendar__tile { height: 62px; border-radius: 10px; position: relative; overflow: hidden; }
  /* Раскраска дней — та же, что в журнале приёмов: врач привык к ней. */
  .cal-busy {
    background: linear-gradient(145deg, #b6e6a2, #a7d68f);
    border: 1px solid #9fd18e; border-radius: 8px; width: 100%; height: 100%;
  }
  .cal-free {
    background: linear-gradient(145deg, #e0edff, #d5e4ff);
    border: 1px solid #a5c8ff; border-radius: 8px; width: 100%; height: 100%;
  }
  .cal-blocked {
    background: linear-gradient(145deg, #f9c5ca, #f8d7da);
    border: 1px solid #f1aeb5; border-radius: 8px; width: 100%; height: 100%;
  }
  .bookpage-legend { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }

  /* ─── Телефон ───────────────────────────────────────────────────────
     Экран 360–430px: календарь и слоты должны помещаться целиком, иначе
     врач не может ни выбрать день, ни нажать на время. Ужимаем отступы и
     сам календарь, а не полагаемся на прокрутку вбок — на телефоне её
     попросту не замечают. */
  @media (max-width: 640px) {
    .bookpage-wrap { padding: 12px 10px 28px; }
    .bookpage-head { gap: 8px; margin-bottom: 12px; }
    .bookpage-title { font-size: 20px; line-height: 1.25; }
    .bookpage-sub { font-size: 13px; }
    /* Кнопки шапки — в строку и во всю ширину, чтобы не резались краем. */
    .bookpage-head > .d-flex { width: 100%; }
    .bookpage-head > .d-flex > .btn { flex: 1 1 0; font-size: 13px; padding: 8px 6px; }

    .bookpage-grid { gap: 12px; }
    .bookpage-wrap .card-body { padding: 12px; }

    .react-calendar { padding: 0; font-size: 13px; }
    .react-calendar__tile { height: 46px; padding: 2px; }
    .react-calendar__navigation { height: 38px; margin-bottom: 6px; }
    .react-calendar__navigation button { min-width: 30px; font-size: 13px; }
    .react-calendar__month-view__weekdays__weekday { padding: 2px; font-size: 10px; }
    .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }

    .bookpage-slots { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 6px; }
    .slot-btn { padding: 8px 9px; }
    .slot-time { font-size: 14px; }
    .slot-meta { font-size: 11px; overflow-wrap: anywhere; }
    .bookpage-legend .badge { font-size: 11px; }
  }

  /* Совсем узкие экраны (320–360): слоты в две колонки всё ещё влезают,
     но только без внутренних отступов по краям. */
  @media (max-width: 360px) {
    .bookpage-wrap { padding: 10px 6px 24px; }
    .react-calendar__tile { height: 42px; }
    .bookpage-slots { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
  }
`;

export default function DoctorBookingPage() {
  const { t } = useTranslation();

  const [date, setDate] = useState(new Date());
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [notice, setNotice] = useState("");

  // Приёмы месяца и закрытые дни — только для раскраски календаря.
  const [appointments, setAppointments] = useState([]);
  const [blockedDays, setBlockedDays] = useState([]);

  const loadCalendarMeta = useCallback(async () => {
    try {
      const [appts, blocked] = await Promise.all([
        axios.get(`${API_BASE}/schedule/appointment/appointments`, {
          withCredentials: true,
        }),
        axios
          .get(`${API_BASE}/schedule/block/blackout-days`, {
            withCredentials: true,
          })
          .catch(() => ({ data: { data: [] } })),
      ]);
      // Архивные НЕ отбрасываем: приём старше семи дней уезжает в архив
      // автоматически, и с прежним фильтром прошлые месяцы в календаре
      // выглядели пустыми — искать в них было нечего и не по чему.
      setAppointments(appts.data?.data || []);
      setBlockedDays(blocked.data?.data || []);
    } catch (err) {
      console.error("Ошибка загрузки календаря:", err);
    }
  }, []);

  useEffect(() => {
    loadCalendarMeta();
  }, [loadCalendarMeta]);

  const load = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/schedule/doctor-schedule/day/${toLocalYMD(d)}`,
        { withCredentials: true },
      );
      setDay(res.data || null);
    } catch (err) {
      console.error("Ошибка загрузки дня:", err);
      setDay(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  // День уже прошёл — страница переходит в режим «только смотреть».
  const isPastDay = date < startOfToday();

  const slots = day?.slots || [];
  // «Свободно» считаем только по тем слотам, в которые реально можно
  // записать: прошедшие свободными не являются, сколько бы их ни осталось
  // в сетке дня.
  const free = slots.filter((s) => s.status === "free" && !isPastSlot(s.start));

  const emptyReason =
    day?.reason === "day_off"
      ? t("booking_page.day_off", "Этот день закрыт в вашем расписании")
      : day?.reason === "no_schedule"
        ? t("booking_page.no_schedule", "Расписание ещё не заполнено")
        : t("booking_page.no_intervals", "В этот день приёма нет");

  return (
    <>
      <style>{styles}</style>

      <div className="bookpage-wrap">
        <div className="bookpage-head">
          <div>
            <h1 className="bookpage-title">
              {t("booking_page.title", "Записать пациента на приём")}
            </h1>
            <div className="bookpage-sub">
              {t(
                "booking_page.subtitle",
                "Выберите день и свободное время. Пациент увидит это время занятым.",
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/doctor/doctor-appointment" className="btn btn-outline-primary">
              {t("booking_page.to_journal", "Журнал приёмов")}
            </Link>
            <Link to="/doctor/doctor-schedule" className="btn btn-outline-secondary">
              {t("booking_page.to_schedule", "Моё расписание")}
            </Link>
          </div>
        </div>

        {notice && (
          <Alert variant="success" onClose={() => setNotice("")} dismissible>
            {notice}
          </Alert>
        )}

        <div className="bookpage-grid">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Calendar
                onChange={setDate}
                value={date}
                locale="ru-RU"
                minDetail="month"
                /* Прошлое ОТКРЫТО для просмотра.
                   Раньше здесь стояли minDate + tileDisabled: они убирали у
                   календаря стрелку назад и гасили прошедшие дни целиком —
                   врач не мог посмотреть, кто у него был на прошлой неделе,
                   не говоря о прошлом годе. А смотреть свой журнал он вправе:
                   это его приёмы.
                   Запрет остался там, где он и нужен, — на изменении:
                   прошедшие слоты не нажимаются, «Другое время» в прошлом
                   дне не предлагается, а сервер отвечает 400 PAST_TIME на
                   любую попытку записать задним числом. */
                tileContent={({ date: d }) => {
                  const ymd = toLocalYMD(d);
                  const isBlocked = blockedDays.some(
                    (b) => b?.date && toLocalYMD(new Date(b.date)) === ymd,
                  );
                  const isBusy = appointments.some((a) => {
                    if (!a?.startsAt) return false;
                    if (toLocalYMD(new Date(a.startsAt)) !== ymd) return false;
                    // Впереди днём с записями считается только живая запись.
                    if (["pending", "confirmed"].includes(a.status)) return true;
                    // Позади — состоявшийся приём. Отменённый визит день не
                    // помечает: приёма не было. Открыть такой день и увидеть
                    // отмену всё равно можно.
                    return (
                      new Date(a.startsAt) < new Date() &&
                      a.status !== "cancelled"
                    );
                  });
                  return (
                    <div
                      className={
                        isBlocked
                          ? "cal-blocked"
                          : isBusy
                            ? "cal-busy"
                            : "cal-free"
                      }
                    />
                  );
                }}
              />

              <div className="bookpage-legend">
                <span className="badge bg-success">
                  {t("booking_page.legend_busy", "Есть записи")}
                </span>
                <span className="badge bg-primary">
                  {t("booking_page.legend_free", "Свободно")}
                </span>
                <span className="badge bg-danger">
                  {t("booking_page.legend_blocked", "Закрыто")}
                </span>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {date.toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  {day?.timezone && (
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {t("booking_page.timezone", "Часовой пояс")}: {day.timezone}
                    </div>
                  )}
                </div>

                {/* Ручная запись — только в настоящем и будущем: в
                    прошедшем дне записывать уже нечего. */}
                {!isPastDay && (
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={() => setBookingSlot({ manual: true })}
                  >
                    + {t("booking_page.manual", "Другое время")}
                  </Button>
                )}
              </div>

              {isPastDay && (
                <Alert variant="secondary" className="py-2 mb-3">
                  {t(
                    "booking_page.past_day",
                    "День уже прошёл: приёмы видны, но изменить их нельзя.",
                  )}
                </Alert>
              )}

              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              )}

              {!loading && slots.length === 0 && (
                <Alert variant="light" className="border">
                  {emptyReason}
                  <div className="mt-2" style={{ fontSize: 13 }}>
                    {t(
                      "booking_page.manual_hint",
                      "Срочного пациента всё равно можно записать — кнопкой «Другое время».",
                    )}
                  </div>
                </Alert>
              )}

              {!loading && slots.length > 0 && (
                <>
                  <div className="text-muted mb-2" style={{ fontSize: 13 }}>
                    {t("booking_page.free_count", "Свободно")}: {free.length} /{" "}
                    {slots.length}
                  </div>

                  <div className="bookpage-slots">
                    {slots.map((s) => {
                      const busy = s.status === "busy";
                      const past = isPastSlot(s.start);
                      const appt = s.appointment;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          className={`slot-btn ${busy ? "busy" : ""} ${
                            past && !busy ? "past" : ""
                          }`}
                          /* Прошедшее время не записывают: приём вчерашним
                             числом ломает и напоминания, и статистику.
                             Сервер отвечает на такую попытку 400 PAST_TIME —
                             здесь мы просто не даём её совершить. */
                          disabled={busy || past}
                          onClick={() => !busy && !past && setBookingSlot(s)}
                          title={
                            busy
                              ? t("booking_page.busy", "Занято")
                              : past
                                ? t("booking_page.past", "Время уже прошло")
                                : t("booking_page.book_here", "Записать на это время")
                          }
                        >
                          <span className="slot-time">
                            {timeLabel(s.start, day?.timezone)}
                          </span>
                          <span className="slot-meta">
                            {busy
                              ? appt?.patient?.name ||
                                t("booking_page.busy", "Занято")
                              : s.type === "video"
                                ? t("booking_page.online", "Онлайн")
                                : t("booking_page.offline", "Очно")}
                          </span>
                          {busy && s.outOfSchedule && (
                            <Badge bg="warning" text="dark">
                              {t("booking_page.out_of_schedule", "вне сетки")}
                            </Badge>
                          )}
                          {/* Чем кончился приём. Показываем только исход,
                              отличный от живой записи: в прошлом дне
                              отменённый приём иначе не отличить от
                              состоявшегося — а это разные ответы на вопрос
                              «кто у меня был». */}
                          {busy && STATUS_LABEL[appt?.status] && (
                            <Badge bg="light" text="dark">
                              {t(
                                `booking_page.${STATUS_LABEL[appt.status].key}`,
                                STATUS_LABEL[appt.status].ru,
                              )}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      <BookPatientModal
        show={!!bookingSlot}
        onHide={() => setBookingSlot(null)}
        slot={bookingSlot?.manual ? null : bookingSlot}
        date={toLocalYMD(date)}
        timezone={day?.timezone}
        onBooked={async (appt, notified) => {
          setBookingSlot(null);
          setNotice(
            notified
              ? t(
                  "booking_page.booked_notified",
                  "Пациент записан, уведомление отправлено",
                )
              : t("booking_page.booked", "Пациент записан"),
          );
          // И слоты дня, и раскраска месяца: день стал занятым.
          await Promise.all([load(date), loadCalendarMeta()]);
        }}
      />
    </>
  );
}
