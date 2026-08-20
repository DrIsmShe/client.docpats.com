// client/src/pages/doctorProfilePages/appointments/BookPatientModal.jsx
//
// Форма записи пациента врачом — открывается кликом по слоту в календаре.
//
// Три вида пациента в одной форме, потому что в жизни врач не различает их
// заранее: человек либо есть в его списках, либо только что позвонил.
//   • «Мой пациент» — поиск среди своих: и аккаунты, и приватные карточки
//   • «Новый»       — имя, фамилия, телефон; карточка заводится на лету
//
// Уведомление уходит только тому, у кого есть аккаунт, — это честно
// показывается в форме, чтобы врач знал, надо ли звонить самому.

import { useCallback, useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Badge, Alert } from "react-bootstrap";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_BASE = process.env.REACT_APP_API_URL;

/** Время слота словами — в зоне расписания врача, а не браузера. */
function formatSlot(iso, timezone) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone || undefined,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export default function BookPatientModal({
  show,
  onHide,
  slot, // { start, end, type } — слот сетки; null = ручное время
  date, // "YYYY-MM-DD" — нужен только для ручного времени
  timezone,
  onBooked,
}) {
  const { t } = useTranslation();

  const [mode, setMode] = useState("existing"); // existing | new
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [type, setType] = useState("offline");
  const [notes, setNotes] = useState("");
  // Ручное время — когда врач принимает вне сетки (срочный пациент, день без
  // расписания). Пустое, пока слот выбран из сетки.
  const [manualTime, setManualTime] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Подтверждение записи вне сетки: сервер отвечает 409 OUT_OF_SCHEDULE, и
  // повтор идёт уже с явным согласием врача.
  const [confirmOff, setConfirmOff] = useState(false);

  // Сброс при каждом открытии: форма, оставшаяся от прошлого слота, — верный
  // способ записать не того пациента.
  useEffect(() => {
    if (!show) return;
    setMode("existing");
    setQuery("");
    setSelected(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setNotes("");
    setError("");
    setConfirmOff(false);
    setManualTime("");
    setType(slot?.type === "video" ? "video" : "offline");
  }, [show, slot]);

  // ── Поиск своих пациентов ───────────────────────────────────────────
  const search = useCallback(async (q) => {
    setSearching(true);
    try {
      const res = await axios.get(
        `${API_BASE}/schedule/appointment/my-patients`,
        { params: { q }, withCredentials: true },
      );
      setItems(res.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!show || mode !== "existing") return undefined;
    // Небольшая задержка: список грузится на каждый символ, а имена
    // расшифровываются на сервере — незачем дёргать его по буквам.
    const id = setTimeout(() => search(query), query ? 300 : 0);
    return () => clearTimeout(id);
  }, [show, mode, query, search]);

  // ── Отправка ────────────────────────────────────────────────────────
  const submit = async (offSchedule = false) => {
    setError("");

    const patient =
      mode === "existing"
        ? selected
          ? { kind: selected.kind, id: selected.id }
          : null
        : { kind: "new", firstName, lastName, phone };

    if (!patient) {
      setError(t("book_patient.err_no_patient", "Выберите пациента"));
      return;
    }
    if (mode === "new" && (!firstName.trim() || !lastName.trim())) {
      setError(t("book_patient.err_name", "Укажите имя и фамилию"));
      return;
    }
    if (!slot && !manualTime) {
      setError(t("book_patient.err_time", "Укажите время приёма"));
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(
        `${API_BASE}/schedule/appointment/book-by-doctor`,
        {
          // Слот сетки — готовый UTC-инстант. Ручное время уходит наивным:
          // зону расписания знает сервер, браузер может стоять в другой.
          ...(slot
            ? { startsAt: slot.start, endsAt: slot.end }
            : { startsAtLocal: `${date}T${manualTime}` }),
          type,
          patient,
          notesDoctor: notes,
          offSchedule,
        },
        { withCredentials: true },
      );
      onBooked?.(res.data?.appointment, res.data?.notified);
      onHide?.();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.code === "OUT_OF_SCHEDULE") {
        setConfirmOff(true);
      } else {
        setError(
          data?.message ||
            t("book_patient.err_generic", "Не удалось создать запись"),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title style={{ fontSize: 18 }}>
          {t("book_patient.title", "Записать пациента")}
          {slot?.start ? (
            <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 400 }}>
              {formatSlot(slot.start, timezone)}
            </div>
          ) : (
            <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 400 }}>
              {date} · {t("book_patient.manual_time", "время вручную")}
            </div>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {confirmOff && (
          <Alert variant="warning">
            {t(
              "book_patient.out_of_schedule",
              "Это время вне вашего расписания. Записать всё равно?",
            )}
            <div className="mt-2 d-flex gap-2">
              <Button
                size="sm"
                variant="warning"
                disabled={saving}
                onClick={() => submit(true)}
              >
                {t("book_patient.book_anyway", "Да, записать")}
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setConfirmOff(false)}
              >
                {t("book_patient.cancel", "Отмена")}
              </Button>
            </div>
          </Alert>
        )}

        {/* Переключатель источника пациента */}
        <div className="d-flex gap-2 mb-3">
          <Button
            size="sm"
            variant={mode === "existing" ? "primary" : "outline-primary"}
            onClick={() => setMode("existing")}
          >
            {t("book_patient.mode_existing", "Мой пациент")}
          </Button>
          <Button
            size="sm"
            variant={mode === "new" ? "primary" : "outline-primary"}
            onClick={() => setMode("new")}
          >
            {t("book_patient.mode_new", "Новый")}
          </Button>
        </div>

        {mode === "existing" ? (
          <>
            <Form.Control
              type="search"
              placeholder={t("book_patient.search", "Поиск по имени или телефону")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2"
            />

            <div
              style={{
                maxHeight: 220,
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
              }}
            >
              {searching && (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                </div>
              )}

              {!searching && items.length === 0 && (
                <div className="text-muted text-center py-3" style={{ fontSize: 14 }}>
                  {t("book_patient.empty", "Никого не найдено")}
                </div>
              )}

              {!searching &&
                items.map((p) => (
                  <button
                    key={`${p.kind}-${p.id}`}
                    type="button"
                    onClick={() => setSelected(p)}
                    className="w-100 text-start px-3 py-2"
                    style={{
                      border: "none",
                      borderBottom: "1px solid #f1f5f9",
                      background:
                        selected?.id === p.id ? "#e0edff" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {p.kind === "private"
                        ? t("book_patient.kind_private", "Приватный пациент")
                        : t("book_patient.kind_registered", "Зарегистрирован")}
                      {p.phone ? ` · ${p.phone}` : ""}
                      {!p.hasAccount && (
                        <>
                          {" · "}
                          <Badge bg="secondary">
                            {t("book_patient.no_account", "без аккаунта")}
                          </Badge>
                        </>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </>
        ) : (
          <>
            <Form.Group className="mb-2">
              <Form.Label>{t("book_patient.first_name", "Имя")}</Form.Label>
              <Form.Control
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>{t("book_patient.last_name", "Фамилия")}</Form.Label>
              <Form.Control
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>{t("book_patient.phone", "Телефон")}</Form.Label>
              <Form.Control
                type="tel"
                placeholder="994501234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Form.Text className="text-muted">
                {t(
                  "book_patient.phone_hint",
                  "Необязательно. По телефону проверяется, не заведён ли уже такой пациент.",
                )}
              </Form.Text>
            </Form.Group>
          </>
        )}

        <hr />

        {!slot && (
          <Form.Group className="mb-2">
            <Form.Label>{t("book_patient.time", "Время приёма")}</Form.Label>
            <Form.Control
              type="time"
              value={manualTime}
              onChange={(e) => setManualTime(e.target.value)}
            />
            <Form.Text className="text-muted">
              {t(
                "book_patient.time_hint",
                "Время по вашему расписанию. Приём вне сетки будет помечен, но слот займёт.",
              )}
            </Form.Text>
          </Form.Group>
        )}

        <Form.Group className="mb-2">
          <Form.Label>{t("book_patient.type", "Тип приёма")}</Form.Label>
          <div className="d-flex gap-3">
            <Form.Check
              type="radio"
              id="appt-type-offline"
              label={t("book_patient.type_offline", "Очно")}
              checked={type === "offline"}
              onChange={() => setType("offline")}
            />
            <Form.Check
              type="radio"
              id="appt-type-video"
              label={t("book_patient.type_video", "Онлайн")}
              checked={type === "video"}
              onChange={() => setType("video")}
            />
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>{t("book_patient.notes", "Заметка (видна только вам)")}</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          {t("book_patient.cancel", "Отмена")}
        </Button>
        <Button
          variant="success"
          disabled={saving || confirmOff}
          onClick={() => submit(false)}
        >
          {saving && <Spinner animation="border" size="sm" className="me-2" />}
          {t("book_patient.submit", "Записать")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
