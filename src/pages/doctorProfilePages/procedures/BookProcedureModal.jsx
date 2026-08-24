// client/src/pages/doctorProfilePages/procedures/BookProcedureModal.jsx
//
// Форма записи на ОПЕРАЦИЮ или ОБСЛЕДОВАНИЕ.
//
// Устроена как форма записи на приём (BookPatientModal) намеренно: врач,
// умеющий записывать на приём, не должен переучиваться. Тот же выбор
// пациента тремя способами, та же шапка, те же кнопки.
//
// Отличия ровно там, где отличается предмет:
//   • вид: операция / обследование — определяет весь дальнейший словарь;
//   • время НЕ выбирается из сетки слотов. Операция длится часы, в
//     двадцатиминутную сетку не ложится — врач называет начало и
//     длительность сам;
//   • подготовка пациента (натощак, анестезия) — то, чего у приёма нет.

import { useCallback, useEffect, useState } from "react";
import { Modal, Button, Form, Spinner, Badge, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { createProcedure, searchMyPatients } from "../../../api/procedures";

// Готовые длительности — чтобы не набирать «90» руками в самом частом
// случае. Поле ввода рядом остаётся: список не может покрыть всё.
const DURATION_PRESETS = [30, 45, 60, 90, 120, 180, 240];

const ANESTHESIA = ["none", "local", "sedation", "regional", "general"];

export default function BookProcedureModal({
  show,
  onHide,
  date, // "YYYY-MM-DD" — день, выбранный в календаре
  timezone,
  defaultKind = "surgery",
  onBooked,
}) {
  const { t } = useTranslation();

  const [kind, setKind] = useState(defaultKind);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [time, setTime] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [place, setPlace] = useState("");
  const [preparation, setPreparation] = useState("");
  const [fasting, setFasting] = useState(false);
  const [anesthesia, setAnesthesia] = useState("none");
  const [notes, setNotes] = useState("");

  const [mode, setMode] = useState("existing"); // existing | new
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Сброс при каждом открытии: форма, оставшаяся от прошлого дня, — верный
  // способ записать не того пациента и не на то время.
  useEffect(() => {
    if (!show) return;
    setKind(defaultKind);
    setTitle("");
    setCode("");
    setTime("");
    setDurationMin(defaultKind === "surgery" ? 90 : 45);
    setPlace("");
    setPreparation("");
    setFasting(false);
    setAnesthesia("none");
    setNotes("");
    setMode("existing");
    setQuery("");
    setSelected(null);
    setFirstName("");
    setLastName("");
    setPhone("");
    setError("");
  }, [show, defaultKind]);

  const search = useCallback(async (q) => {
    setSearching(true);
    try {
      setItems(await searchMyPatients(q));
    } catch {
      setItems([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!show || mode !== "existing") return undefined;
    // Задержка: имена расшифровываются на сервере, дёргать его по букве
    // незачем.
    const id = setTimeout(() => search(query), query ? 300 : 0);
    return () => clearTimeout(id);
  }, [show, mode, query, search]);

  const submit = async () => {
    setError("");

    const patient =
      mode === "existing"
        ? selected
          ? { kind: selected.kind, id: selected.id }
          : null
        : { kind: "new", firstName, lastName, phone };

    if (!patient) {
      setError(t("book_procedure.err_no_patient", "Выберите пациента"));
      return;
    }
    if (mode === "new" && (!firstName.trim() || !lastName.trim())) {
      setError(t("book_procedure.err_name", "Укажите имя и фамилию"));
      return;
    }
    if (!title.trim()) {
      setError(
        t("book_procedure.err_title", "Укажите название вмешательства"),
      );
      return;
    }
    if (!time) {
      setError(t("book_procedure.err_time", "Укажите время начала"));
      return;
    }

    setSaving(true);
    try {
      // Время уходит наивным локальным: зону расписания знает сервер.
      const data = await createProcedure({
        kind,
        title: title.trim(),
        code: code.trim() || undefined,
        startsAtLocal: `${date}T${time}`,
        durationMin: Number(durationMin),
        place: place.trim() || undefined,
        preparation: preparation.trim() || undefined,
        fasting,
        anesthesia,
        notesDoctor: notes.trim() || undefined,
        patient,
      });
      onBooked?.(data?.procedure, data?.notified);
      onHide?.();
    } catch (err) {
      const data = err?.response?.data;
      setError(
        data?.message ||
          t("book_procedure.err_generic", "Не удалось создать запись"),
      );
    } finally {
      setSaving(false);
    }
  };

  const isSurgery = kind === "surgery";

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title style={{ fontSize: 18 }}>
          {isSurgery
            ? t("book_procedure.title_surgery", "Записать на операцию")
            : t("book_procedure.title_exam", "Записать на обследование")}
          <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 400 }}>
            {date}
            {timezone ? ` · ${timezone}` : ""}
          </div>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Вид вмешательства — первым, он задаёт смысл всему остальному */}
        <div className="d-flex gap-2 mb-3">
          <Button
            size="sm"
            variant={isSurgery ? "primary" : "outline-primary"}
            onClick={() => setKind("surgery")}
          >
            {t("book_procedure.kind_surgery", "Операция")}
          </Button>
          <Button
            size="sm"
            variant={!isSurgery ? "primary" : "outline-primary"}
            onClick={() => setKind("examination")}
          >
            {t("book_procedure.kind_exam", "Обследование")}
          </Button>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>
            {t("book_procedure.title_field", "Название вмешательства")}
          </Form.Label>
          <Form.Control
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isSurgery
                ? t("book_procedure.title_ph_surgery", "Например: септопластика")
                : t("book_procedure.title_ph_exam", "Например: МРТ головного мозга")
            }
            maxLength={300}
          />
        </Form.Group>

        <div className="d-flex gap-3 flex-wrap mb-3">
          <Form.Group style={{ minWidth: 140 }}>
            <Form.Label>{t("book_procedure.time", "Начало")}</Form.Label>
            <Form.Control
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Form.Group>

          <Form.Group style={{ minWidth: 180 }}>
            <Form.Label>
              {t("book_procedure.duration", "Длительность, мин")}
            </Form.Label>
            <Form.Control
              type="number"
              min={15}
              max={1440}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
            <div className="d-flex gap-1 flex-wrap mt-1">
              {DURATION_PRESETS.map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={
                    Number(durationMin) === m ? "secondary" : "outline-secondary"
                  }
                  style={{ padding: "1px 8px", fontSize: 12 }}
                  onClick={() => setDurationMin(m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </Form.Group>

          <Form.Group style={{ minWidth: 160, flex: 1 }}>
            <Form.Label>
              {t("book_procedure.code", "Код (необязательно)")}
            </Form.Label>
            <Form.Control
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={40}
            />
          </Form.Group>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>
            {t("book_procedure.place", "Место (операционная, кабинет, адрес)")}
          </Form.Label>
          <Form.Control
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={300}
          />
        </Form.Group>

        {/* Подготовка — то, чего у приёма нет вовсе */}
        <div className="p-3 mb-3" style={{ background: "#f8fafc", borderRadius: 8 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {t("book_procedure.prep_head", "Подготовка пациента")}
          </div>

          <Form.Group className="mb-2">
            <Form.Control
              as="textarea"
              rows={2}
              value={preparation}
              onChange={(e) => setPreparation(e.target.value)}
              placeholder={t(
                "book_procedure.prep_ph",
                "Что сделать до вмешательства — пациент увидит это в уведомлении",
              )}
              maxLength={2000}
            />
          </Form.Group>

          <div className="d-flex gap-3 flex-wrap align-items-end">
            <Form.Check
              type="checkbox"
              id="proc-fasting"
              label={t("book_procedure.fasting", "Натощак")}
              checked={fasting}
              onChange={(e) => setFasting(e.target.checked)}
            />
            <Form.Group style={{ minWidth: 200 }}>
              <Form.Label>
                {t("book_procedure.anesthesia", "Анестезия")}
              </Form.Label>
              <Form.Select
                value={anesthesia}
                onChange={(e) => setAnesthesia(e.target.value)}
              >
                {ANESTHESIA.map((a) => (
                  <option key={a} value={a}>
                    {t(`book_procedure.anesthesia_${a}`, a)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        </div>

        {/* Пациент — тот же выбор, что и в записи на приём */}
        <div className="d-flex gap-2 mb-2">
          <Button
            size="sm"
            variant={mode === "existing" ? "primary" : "outline-primary"}
            onClick={() => setMode("existing")}
          >
            {t("book_procedure.mode_existing", "Мой пациент")}
          </Button>
          <Button
            size="sm"
            variant={mode === "new" ? "primary" : "outline-primary"}
            onClick={() => setMode("new")}
          >
            {t("book_procedure.mode_new", "Новый")}
          </Button>
        </div>

        {mode === "existing" ? (
          <>
            <Form.Control
              type="search"
              placeholder={t(
                "book_procedure.search",
                "Поиск по имени или телефону",
              )}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mb-2"
            />
            <div
              style={{
                maxHeight: 200,
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
                <div
                  className="text-muted text-center py-3"
                  style={{ fontSize: 14 }}
                >
                  {t("book_procedure.empty", "Никого не найдено")}
                </div>
              )}
              {items.map((p) => (
                <button
                  type="button"
                  key={`${p.kind}-${p.id}`}
                  onClick={() => setSelected(p)}
                  className="w-100 text-start px-3 py-2 border-0"
                  style={{
                    background:
                      selected?.id === p.id ? "#e0f2fe" : "transparent",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {p.phone || "—"}{" "}
                    <Badge
                      bg={p.kind === "registered" ? "success" : "secondary"}
                      style={{ fontSize: 10 }}
                    >
                      {p.kind === "registered"
                        ? t("book_procedure.has_account", "аккаунт")
                        : t("book_procedure.card_only", "карточка")}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="d-flex gap-2 flex-wrap">
            <Form.Control
              style={{ flex: "1 1 140px" }}
              placeholder={t("book_procedure.first_name", "Имя")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Form.Control
              style={{ flex: "1 1 140px" }}
              placeholder={t("book_procedure.last_name", "Фамилия")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Form.Control
              style={{ flex: "1 1 140px" }}
              placeholder={t("book_procedure.phone", "Телефон")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        <Form.Group className="mt-3">
          <Form.Label>
            {t("book_procedure.notes", "Заметка (видна только вам)")}
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
          />
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          {t("book_procedure.cancel", "Отмена")}
        </Button>
        <Button variant="success" disabled={saving} onClick={submit}>
          {saving && <Spinner animation="border" size="sm" className="me-2" />}
          {t("book_procedure.submit", "Записать")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
