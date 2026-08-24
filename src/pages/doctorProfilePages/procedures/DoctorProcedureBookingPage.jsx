// client/src/pages/doctorProfilePages/procedures/DoctorProcedureBookingPage.jsx
//
// «Записать на операцию или обследование» — отдельная страница рядом с
// «Записать пациента на приём», а не режим внутри неё.
//
// Раскладка и оформление повторяют DoctorBookingPage сознательно: календарь
// месяца слева, содержимое дня справа. Врач, знающий страницу приёмов, здесь
// ничего не изучает заново.
//
// Отличие по существу одно, и оно на виду: справа не сетка свободных слотов,
// а ЛЕНТА ДНЯ. У операции нет слота — она длится столько, сколько длится,
// поэтому день показывается как есть: назначенные вмешательства и занятость
// приёмами. Приёмы приходят обезличенными (сервер отдаёт только интервал) —
// врачу здесь нужно знать, что время занято, а не кем.

import { useCallback, useEffect, useState } from "react";
import { Card, Button, Badge, Spinner, Alert } from "react-bootstrap";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import BookProcedureModal from "./BookProcedureModal.jsx";
import {
  getProcedureDay,
  listProcedures,
  setProcedureStatus,
} from "../../../api/procedures";

/** Дата календаря в "YYYY-MM-DD" по ЛОКАЛЬНОМУ времени.
 *  toISOString() здесь нельзя: полночь по Баку (+04) — это предыдущие сутки
 *  по UTC, и день уезжал бы назад. */
function toLocalYMD(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}

function startOfTodayYMD() {
  return toLocalYMD(new Date());
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

// Цвет статуса. Живые записи выделены, исходы приглушены — на ленте дня
// глазом должно находиться то, что ещё предстоит.
const STATUS_VARIANT = {
  planned: "primary",
  confirmed: "success",
  completed: "secondary",
  postponed: "warning",
  cancelled: "light",
  no_show: "dark",
};

const styles = `
  .procpage-wrap, .procpage-wrap * { box-sizing: border-box; }
  .procpage-wrap {
    padding: 18px; max-width: 1200px; width: 100%; margin: 0 auto;
    overflow-x: hidden;
  }
  .procpage-head {
    display: flex; flex-wrap: wrap; gap: 12px;
    align-items: center; justify-content: space-between; margin-bottom: 16px;
  }
  .procpage-title { font-size: 26px; font-weight: 800; margin: 0; overflow-wrap: anywhere; }
  .procpage-sub { color: #64748b; font-size: 14px; overflow-wrap: anywhere; }
  .procpage-grid {
    display: grid; gap: 18px;
    grid-template-columns: minmax(320px, 460px) 1fr;
    align-items: start;
  }
  /* Ячейки грида по умолчанию не сжимаются меньше содержимого — без этого
     календарь распирает колонку и страница вылезает за экран телефона. */
  .procpage-grid > * { min-width: 0; }
  @media (max-width: 900px) { .procpage-grid { grid-template-columns: 1fr; } }

  .proc-row {
    display: flex; gap: 12px; align-items: flex-start;
    border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 12px 14px; margin-bottom: 10px; background: #fff;
  }
  .proc-row.surgery { border-left: 4px solid #2563eb; }
  .proc-row.examination { border-left: 4px solid #0d9488; }
  /* Занятость приёмом — намеренно бледная: это чужая запись, показанная
     только чтобы врач не назначил операцию поверх неё. */
  .proc-row.busy {
    border-left: 4px solid #cbd5e1; background: #f8fafc; color: #64748b;
  }
  .proc-time { font-weight: 700; font-size: 15px; white-space: nowrap; }
  .proc-title { font-weight: 600; overflow-wrap: anywhere; }
  .proc-meta { font-size: 12px; color: #64748b; overflow-wrap: anywhere; }

  .react-calendar { width: 100%; border: none; border-radius: 14px; padding: 10px; }
  .react-calendar__tile { height: 62px; border-radius: 10px; position: relative; overflow: hidden; }
  /* Метки дня, а НЕ заливка всей плитки.
     Заливка может быть только ОДНОГО цвета, и день, в котором есть и
     операция, и обследование, показывал что-то одно — то есть врал.
     Две метки рядом говорят правду и читаются без легенды. */
  .cal-marks {
    position: absolute; left: 0; right: 0; bottom: 5px;
    display: flex; justify-content: center; gap: 4px; pointer-events: none;
  }
  .cal-mark {
    min-width: 16px; height: 16px; padding: 0 4px;
    border-radius: 999px; font-size: 10px; font-weight: 700; line-height: 16px;
    color: #fff; text-align: center;
  }
  .cal-mark.is-surgery { background: #2563eb; }
  .cal-mark.is-exam { background: #0d9488; }

  .procpage-legend {
    display: flex; gap: 14px; flex-wrap: wrap; margin-top: 12px;
    font-size: 13px; color: #475569;
  }
  .procpage-legend span { display: inline-flex; align-items: center; gap: 6px; }
  /* Кружок легенды — тот же цвет, что и метка в календаре, и та же полоса,
     что у строки справа. Легенда со своими цветами — не легенда. */
  .legend-dot { width: 12px; height: 12px; border-radius: 4px; display: inline-block; }
  .legend-dot.is-surgery { background: #2563eb; }
  .legend-dot.is-exam { background: #0d9488; }
  .legend-dot.is-busy { background: #cbd5e1; }

  @media (max-width: 640px) {
    .procpage-wrap { padding: 12px 10px 28px; }
    .procpage-title { font-size: 20px; line-height: 1.25; }
    .procpage-sub { font-size: 13px; }
    .procpage-head > .d-flex { width: 100%; }
    .procpage-head > .d-flex > .btn { flex: 1 1 0; font-size: 13px; padding: 8px 6px; }
    .procpage-grid { gap: 12px; }
    .procpage-wrap .card-body { padding: 12px; }
    .react-calendar { padding: 0; font-size: 13px; }
    .react-calendar__tile { height: 46px; padding: 2px; }
    .react-calendar__navigation { height: 38px; margin-bottom: 6px; }
    .react-calendar__month-view__weekdays__weekday { padding: 2px; font-size: 10px; }
    .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; }
    .proc-row { padding: 10px; gap: 8px; }
  }
`;

export default function DoctorProcedureBookingPage() {
  const { t } = useTranslation();

  const [date, setDate] = useState(new Date());
  const [day, setDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalKind, setModalKind] = useState("surgery");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Вмешательства для раскраски календаря. Отдельным запросом от дня:
  // календарь перерисовывается при смене месяца, а день — при смене дня.
  const [all, setAll] = useState([]);

  const ymd = toLocalYMD(date);

  const loadAll = useCallback(async () => {
    try {
      const { items } = await listProcedures();
      setAll(items);
    } catch {
      setAll([]);
    }
  }, []);

  const loadDay = useCallback(async (d) => {
    setLoading(true);
    setError("");
    try {
      setDay(await getProcedureDay(d));
    } catch (err) {
      setDay(null);
      setError(
        err?.response?.data?.message ||
          t("procedure_page.err_day", "Не удалось загрузить день"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadDay(ymd);
  }, [ymd, loadDay]);

  const isPastDay = ymd < startOfTodayYMD();

  const procedures = day?.procedures || [];
  const busy = day?.busy || [];
  const timezone = day?.timezone;

  // Одна лента: вмешательства и занятость приёмами вперемешку по времени.
  // Разделять их на два списка означало бы заставить врача сличать часы
  // глазами — ровно та работа, которую страница должна делать за него.
  const timeline = [
    ...procedures.map((p) => ({ ...p, source: "procedure" })),
    ...busy,
  ].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const openModal = (kind) => {
    setModalKind(kind);
    setShowModal(true);
  };

  const onBooked = async (procedure, notified) => {
    setNotice(
      notified
        ? t(
            "procedure_page.booked_notified",
            "Запись создана, пациент уведомлён",
          )
        : t(
            "procedure_page.booked",
            "Запись создана. У пациента нет аккаунта — сообщите ему сами",
          ),
    );
    await Promise.all([loadDay(ymd), loadAll()]);
  };

  const changeStatus = async (id, status) => {
    setError("");
    try {
      await setProcedureStatus(id, status);
      await Promise.all([loadDay(ymd), loadAll()]);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("procedure_page.err_status", "Не удалось изменить статус"),
      );
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="procpage-wrap">
        <div className="procpage-head">
          <div>
            <h1 className="procpage-title">
              {t(
                "procedure_page.title",
                "Записать на операцию или обследование",
              )}
            </h1>
            <div className="procpage-sub">
              {t(
                "procedure_page.subtitle",
                "Выберите день и назначьте вмешательство. Время займётся и в вашем календаре приёмов.",
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/doctor/procedures" className="btn btn-outline-primary">
              {t("procedure_page.to_journal", "Журнал вмешательств")}
            </Link>
            <Link
              to="/doctor/book-patient"
              className="btn btn-outline-secondary"
            >
              {t("procedure_page.to_appointments", "Запись на приём")}
            </Link>
          </div>
        </div>

        {notice && (
          <Alert variant="success" onClose={() => setNotice("")} dismissible>
            {notice}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        <div className="procpage-grid">
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Calendar
                onChange={setDate}
                value={date}
                locale="ru-RU"
                minDetail="month"
                /* Прошлое открыто для просмотра — врач вправе посмотреть,
                   что у него было. Запрет стоит там, где он нужен: кнопка
                   записи в прошлом дне не показывается, а сервер отвечает
                   400 PAST_TIME на любую попытку назначить задним числом. */
                tileContent={({ date: d }) => {
                  const key = toLocalYMD(d);
                  const ofDay = all.filter(
                    (p) =>
                      toLocalYMD(new Date(p.startsAt)) === key &&
                      ["planned", "confirmed"].includes(p.status),
                  );
                  if (!ofDay.length) return null;
                  const surgeries = ofDay.filter(
                    (p) => p.kind === "surgery",
                  ).length;
                  const exams = ofDay.length - surgeries;
                  // Цифра — только когда её есть смысл читать: «1» на метке
                  // ничего не добавляет к самому факту метки.
                  return (
                    <div className="cal-marks">
                      {surgeries > 0 && (
                        <span
                          className="cal-mark is-surgery"
                          title={t(
                            "procedure_page.legend_surgery",
                            "Операция",
                          )}
                        >
                          {surgeries > 1 ? surgeries : ""}
                        </span>
                      )}
                      {exams > 0 && (
                        <span
                          className="cal-mark is-exam"
                          title={t(
                            "procedure_page.legend_exam",
                            "Обследование",
                          )}
                        >
                          {exams > 1 ? exams : ""}
                        </span>
                      )}
                    </div>
                  );
                }}
              />

              <div className="procpage-legend">
                <span>
                  <i className="legend-dot is-surgery" />
                  {t("procedure_page.legend_surgery", "Операция")}
                </span>
                <span>
                  <i className="legend-dot is-exam" />
                  {t("procedure_page.legend_exam", "Обследование")}
                </span>
                <span>
                  <i className="legend-dot is-busy" />
                  {t("procedure_page.legend_busy", "Занято приёмом")}
                </span>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{ymd}</div>
                  {timezone && (
                    <div className="procpage-sub">{timezone}</div>
                  )}
                </div>
                {!isPastDay && (
                  <div className="d-flex gap-2">
                    <Button size="sm" onClick={() => openModal("surgery")}>
                      {t("procedure_page.add_surgery", "+ Операция")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => openModal("examination")}
                    >
                      {t("procedure_page.add_exam", "+ Обследование")}
                    </Button>
                  </div>
                )}
              </div>

              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              )}

              {!loading && timeline.length === 0 && (
                <div className="text-muted py-4 text-center">
                  {isPastDay
                    ? t("procedure_page.empty_past", "В этот день ничего не было")
                    : t(
                        "procedure_page.empty",
                        "В этот день ничего не назначено",
                      )}
                </div>
              )}

              {!loading &&
                timeline.map((row) =>
                  row.source === "appointment" ? (
                    <div key={`a-${row._id}`} className="proc-row busy">
                      <div className="proc-time">
                        {timeLabel(row.startsAt, timezone)}
                      </div>
                      <div>
                        <div className="proc-title">
                          {t("procedure_page.busy_appointment", "Приём")}
                        </div>
                        <div className="proc-meta">
                          {t(
                            "procedure_page.busy_hint",
                            "Время занято записью на приём",
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={`p-${row._id}`} className={`proc-row ${row.kind}`}>
                      <div className="proc-time">
                        {timeLabel(row.startsAt, timezone)}
                        <div className="proc-meta">
                          {row.durationMin}{" "}
                          {t("procedure_page.min", "мин")}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="proc-title">{row.title}</div>
                        <div className="proc-meta">
                          {row.patient?.name || "—"}
                          {row.place ? ` · ${row.place}` : ""}
                          {row.fasting
                            ? ` · ${t("procedure_page.fasting", "натощак")}`
                            : ""}
                        </div>
                        {row.preparation && (
                          <div className="proc-meta">{row.preparation}</div>
                        )}
                      </div>
                      <div className="d-flex flex-column gap-1 align-items-end">
                        <Badge bg={STATUS_VARIANT[row.status] || "secondary"}>
                          {t(
                            `procedure_page.status_${row.status}`,
                            row.status,
                          )}
                        </Badge>
                        {["planned", "confirmed"].includes(row.status) && (
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline-success"
                              style={{ padding: "1px 8px", fontSize: 12 }}
                              onClick={() => changeStatus(row._id, "completed")}
                            >
                              {t("procedure_page.done", "Проведено")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              style={{ padding: "1px 8px", fontSize: 12 }}
                              onClick={() => changeStatus(row._id, "cancelled")}
                            >
                              {t("procedure_page.cancel", "Отменить")}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )}
            </Card.Body>
          </Card>
        </div>
      </div>

      <BookProcedureModal
        show={showModal}
        onHide={() => setShowModal(false)}
        date={ymd}
        timezone={timezone}
        defaultKind={modalKind}
        onBooked={onBooked}
      />
    </>
  );
}
