// client/src/pages/patientProfilePages/accessLog/AccessLogPage.jsx
//
// «Кто открывал мою карту».
//
// Право пациента знать это и есть причина, по которой закон требует
// журнал доступа. Журнал у нас пишется с самого начала — семь лет
// хранения, запрет на изменение и удаление, — а показать его было
// некому.
//
// ЧЕГО ЗДЕСЬ НЕТ И ПОЧЕМУ. Имени сотрудника. Назвать медсестру по имени
// человеку, недовольному тем, что его карту открывали, — значит создать
// конфликт между двумя людьми, ни один из которых не решает, кому
// положен доступ. Отвечает организация, её и показываем. Поимённый
// разбор остаётся администратору клиники: у него тот же журнал целиком.

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "../../../axios";
import "./accessLog.css";

function fmt(d) {
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROLE = {
  doctor: "врач",
  nurse: "медсестра",
  receptionist: "регистратура",
  admin: "администратор",
  owner: "руководитель клиники",
  manager: "менеджер",
  patient: "вы",
};

export default function AccessLogPage() {
  const { t } = useTranslation("patientArea");
  const [items, setItems] = useState([]);
  const [includeOwn, setIncludeOwn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/me/access-log", {
        params: includeOwn ? { includeOwn: 1 } : {},
      });
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Не удалось загрузить журнал");
    } finally {
      setLoading(false);
    }
  }, [includeOwn]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="al-page">
      <h1>{t("accessLog.title")}</h1>
      <p className="al-lead">
        {t("accessLog.note")}
      </p>

      <label className="al-toggle">
        <input
          type="checkbox"
          checked={includeOwn}
          onChange={(e) => setIncludeOwn(e.target.checked)}
        />
        <span>{t("accessLog.showOwn")}</span>
      </label>

      {error && <p className="al-error">{error}</p>}
      {loading && <p className="al-hint">{t("accessLog.loading")}</p>}

      {!loading && items.length === 0 && (
        <p className="al-hint">
          {t("accessLog.empty")}
        </p>
      )}

      {items.length > 0 && (
        <ul className="al-list">
          {items.map((it, i) => (
            <li
              key={i}
              className={`al-row ${it.denied ? "is-denied" : ""} ${it.isOwn ? "is-own" : ""}`}
            >
              <time className="al-row__at">{fmt(it.at)}</time>
              <div className="al-row__body">
                <span className="al-row__org">{it.organization}</span>
                {it.role && (
                  <span className="al-row__role">
                    {ROLE[it.role] || it.role}
                  </span>
                )}
                <span className="al-row__what">
                  {it.what} — {it.section}
                </span>
                {/* Отказ показываем прямо: «вашу карту пытались открыть
                    и не смогли» — это ровно то, ради чего журнал ведут. */}
                {it.denied && (
                  <span className="al-row__denied">{t("accessLog.denied")}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="al-note">
        {t("accessLog.orgNote")}
      </p>
    </div>
  );
}
