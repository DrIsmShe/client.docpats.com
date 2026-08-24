// client/src/pages/doctorProfilePages/procedures/DoctorProceduresJournalPage.jsx
//
// Журнал вмешательств: список всего назначенного, с фильтрами по виду и
// статусу и с архивом.
//
// Соотношение со страницей записи — то же, что у журнала приёмов со
// страницей «Записать пациента»: здесь смотрят и закрывают, там назначают.
// Разделены по той же причине: регистратурное действие «назначь на четверг»
// не должно требовать прохода через список из трёхсот записей.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Badge, Spinner, Alert, Form } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  listProcedures,
  setProcedureStatus,
  archiveProcedure,
  postponeProcedure,
} from "../../../api/procedures";

const STATUS_VARIANT = {
  planned: "primary",
  confirmed: "success",
  completed: "secondary",
  postponed: "warning",
  cancelled: "light",
  no_show: "dark",
};

function dateTimeLabel(iso, timezone) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone || undefined,
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

const styles = `
  .procj-wrap, .procj-wrap * { box-sizing: border-box; }
  .procj-wrap { padding: 18px; max-width: 1100px; margin: 0 auto; overflow-x: hidden; }
  .procj-head {
    display: flex; flex-wrap: wrap; gap: 12px;
    align-items: center; justify-content: space-between; margin-bottom: 16px;
  }
  .procj-title { font-size: 26px; font-weight: 800; margin: 0; overflow-wrap: anywhere; }
  .procj-sub { color: #64748b; font-size: 14px; }
  .procj-row {
    display: flex; gap: 14px; align-items: flex-start; flex-wrap: wrap;
    border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 12px 14px; margin-bottom: 10px; background: #fff;
  }
  .procj-row.surgery { border-left: 4px solid #2563eb; }
  .procj-row.examination { border-left: 4px solid #0d9488; }
  .procj-when { font-weight: 700; white-space: nowrap; min-width: 170px; }
  .procj-title-cell { font-weight: 600; overflow-wrap: anywhere; }
  .procj-meta { font-size: 12px; color: #64748b; overflow-wrap: anywhere; }
  .procj-filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  @media (max-width: 640px) {
    .procj-wrap { padding: 12px 10px 28px; }
    .procj-title { font-size: 20px; }
    .procj-when { min-width: 0; }
    .procj-head > .d-flex { width: 100%; }
    .procj-head > .d-flex > .btn { flex: 1 1 0; font-size: 13px; }
  }
`;

export default function DoctorProceduresJournalPage() {
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [timezone, setTimezone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("");
  const [archived, setArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listProcedures({
        ...(kind ? { kind } : {}),
        ...(archived ? { archived: "1" } : {}),
      });
      setItems(res.items);
      setTimezone(res.timezone);
    } catch (err) {
      setItems([]);
      setError(
        err?.response?.data?.message ||
          t("procedure_journal.err_load", "Не удалось загрузить журнал"),
      );
    } finally {
      setLoading(false);
    }
  }, [kind, archived, t]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("procedure_journal.err_action", "Действие не выполнено"),
      );
    }
  };

  // Предстоящее сверху, прошедшее ниже: журнал открывают, чтобы посмотреть,
  // что впереди, а не что было в прошлом марте.
  const sorted = useMemo(() => {
    const now = Date.now();
    const future = [];
    const past = [];
    for (const p of items) {
      (new Date(p.startsAt).getTime() >= now ? future : past).push(p);
    }
    future.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    past.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
    return [...future, ...past];
  }, [items]);

  const postpone = async (row) => {
    // Дата спрашивается простым prompt намеренно: полноценный выбор времени
    // уже есть на странице записи, и дублировать его здесь ради переноса
    // значит держать две формы, расходящиеся при первой правке.
    const value = window.prompt(
      t(
        "procedure_journal.postpone_prompt",
        "Новая дата и время в формате ГГГГ-ММ-ДДТЧЧ:ММ",
      ),
      String(row.startsAt).slice(0, 16),
    );
    if (!value) return;
    await act(() =>
      postponeProcedure(row._id, { startsAtLocal: value.trim() }),
    );
  };

  return (
    <>
      <style>{styles}</style>

      <div className="procj-wrap">
        <div className="procj-head">
          <div>
            <h1 className="procj-title">
              {t("procedure_journal.title", "Журнал вмешательств")}
            </h1>
            <div className="procj-sub">
              {t(
                "procedure_journal.subtitle",
                "Операции и обследования: что предстоит и что уже проведено",
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link to="/doctor/book-procedure" className="btn btn-primary">
              {t("procedure_journal.to_booking", "Записать")}
            </Link>
            <Link to="/doctor/book-patient" className="btn btn-outline-secondary">
              {t("procedure_journal.to_appointments", "Запись на приём")}
            </Link>
          </div>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        <div className="procj-filters">
          <Form.Select
            style={{ maxWidth: 220 }}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">
              {t("procedure_journal.all_kinds", "Все виды")}
            </option>
            <option value="surgery">
              {t("procedure_journal.surgery", "Операции")}
            </option>
            <option value="examination">
              {t("procedure_journal.examination", "Обследования")}
            </option>
          </Form.Select>
          <Form.Check
            type="switch"
            id="procj-archived"
            label={t("procedure_journal.archived", "Архив")}
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
          />
        </div>

        <Card className="shadow-sm border-0">
          <Card.Body>
            {loading && (
              <div className="text-center py-4">
                <Spinner animation="border" />
              </div>
            )}

            {!loading && sorted.length === 0 && (
              <div className="text-muted text-center py-4">
                {archived
                  ? t("procedure_journal.empty_archive", "В архиве пусто")
                  : t("procedure_journal.empty", "Записей пока нет")}
              </div>
            )}

            {!loading &&
              sorted.map((row) => (
                <div key={row._id} className={`procj-row ${row.kind}`}>
                  <div className="procj-when">
                    {dateTimeLabel(row.startsAt, timezone)}
                    <div className="procj-meta">
                      {row.durationMin} {t("procedure_journal.min", "мин")}
                    </div>
                  </div>

                  <div style={{ flex: "1 1 240px" }}>
                    <div className="procj-title-cell">{row.title}</div>
                    <div className="procj-meta">
                      {row.patient?.name || "—"}
                      {row.code ? ` · ${row.code}` : ""}
                      {row.place ? ` · ${row.place}` : ""}
                    </div>
                    {row.preparation && (
                      <div className="procj-meta">{row.preparation}</div>
                    )}
                    {row.cancelReason && (
                      <div className="procj-meta">
                        {t("procedure_journal.reason", "Причина")}:{" "}
                        {row.cancelReason}
                      </div>
                    )}
                  </div>

                  <div className="d-flex flex-column gap-1 align-items-end">
                    <Badge bg={STATUS_VARIANT[row.status] || "secondary"}>
                      {t(`procedure_page.status_${row.status}`, row.status)}
                    </Badge>

                    <div className="d-flex gap-1 flex-wrap justify-content-end">
                      {["planned", "confirmed"].includes(row.status) && (
                        <>
                          {row.status === "planned" && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              style={{ padding: "1px 8px", fontSize: 12 }}
                              onClick={() =>
                                act(() =>
                                  setProcedureStatus(row._id, "confirmed"),
                                )
                              }
                            >
                              {t("procedure_journal.confirm", "Подтвердить")}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline-success"
                            style={{ padding: "1px 8px", fontSize: 12 }}
                            onClick={() =>
                              act(() =>
                                setProcedureStatus(row._id, "completed"),
                              )
                            }
                          >
                            {t("procedure_journal.done", "Проведено")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-warning"
                            style={{ padding: "1px 8px", fontSize: 12 }}
                            onClick={() => postpone(row)}
                          >
                            {t("procedure_journal.postpone", "Перенести")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            style={{ padding: "1px 8px", fontSize: 12 }}
                            onClick={() =>
                              act(() =>
                                setProcedureStatus(row._id, "cancelled"),
                              )
                            }
                          >
                            {t("procedure_journal.cancel", "Отменить")}
                          </Button>
                        </>
                      )}

                      {/* Архивировать можно только закрытую запись — сервер
                          откажет для живой, и кнопку тут показывать незачем. */}
                      {!["planned", "confirmed"].includes(row.status) && (
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          style={{ padding: "1px 8px", fontSize: 12 }}
                          onClick={() =>
                            act(() => archiveProcedure(row._id, !archived))
                          }
                        >
                          {archived
                            ? t("procedure_journal.unarchive", "Из архива")
                            : t("procedure_journal.archive", "В архив")}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </Card.Body>
        </Card>
      </div>
    </>
  );
}
