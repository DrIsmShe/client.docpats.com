// client/src/pages/admin/components/AdminTransferShell.jsx
//
// Общая обвязка страниц переноса данных: выбор базы, состав базы и поле
// пароля. Вынесена отдельно, потому что все четыре страницы (выгрузка базы,
// выгрузка коллекции, загрузка базы, загрузка коллекции) начинаются одинаково,
// а разъехавшиеся копии этой части — верный способ получить страницу, которая
// шлёт запрос не в ту базу.

import { useEffect, useState } from "react";

import {
  fetchDatabases,
  fetchCollections,
  humanSize,
} from "../../../api/adminTransfer";

export default function AdminTransferShell({
  title,
  hint,
  danger = false,
  children,
}) {
  const [databases, setDatabases] = useState([]);
  const [database, setDatabase] = useState("");
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatabases()
      .then((list) => {
        setDatabases(list);
        setDatabase(list[0]?.name || "");
      })
      .catch(() => setError("Не удалось получить список баз"));
  }, []);

  useEffect(() => {
    if (!database) return;
    setInfo(null);
    fetchCollections(database)
      .then(setInfo)
      .catch(() => setError("Не удалось прочитать состав базы"));
  }, [database]);

  const selected = databases.find((d) => d.name === database);

  return (
    <div className="container-fluid py-4" style={{ maxWidth: 900 }}>
      <h4 className="mb-1">{title}</h4>
      {hint && <p className="text-muted small">{hint}</p>}

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="mb-3">
        <label className="form-label small text-muted">База данных</label>
        <select
          className="form-select"
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
        >
          {databases.map((d) => (
            <option key={d.name} value={d.name}>
              {d.title} — {d.name}
            </option>
          ))}
        </select>
        {/* Предупреждение видно ДО действия, а не после: в одной из баз лежат
            медицинские данные пациентов, в другой — новости. */}
        {selected?.phi && (
          <div className="form-text text-danger">
            В этой базе медицинские данные пациентов. Файл содержит их в
            зашифрованном виде, но связи, коды диагнозов и структура — открыты.
            Обращайтесь с ним как с медицинской картой.
          </div>
        )}
      </div>

      {info && (
        <div className="mb-3 small text-muted">
          Коллекций: <b>{info.collections.length}</b> · документов:{" "}
          <b>{info.totalDocuments.toLocaleString("ru")}</b> · объём:{" "}
          <b>{humanSize(info.totalSize)}</b>
          {/* Файл выгрузки крупнее самих данных: канонический EJSON пишет типы
              явно ($oid, $date), зато ничего не теряет. Пусть это не будет
              неожиданностью при скачивании. */}
          {info.totalSize > 200 * 1024 * 1024 && (
            <div className="text-warning mt-1">
              Файл выгрузки выйдет примерно вдвое больше — около{" "}
              {humanSize(info.totalSize * 2)}. Браузер собирает его в памяти
              вкладки; если не хватит, качайте коллекции по отдельности.
            </div>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label small text-muted">
          Пароль администратора
        </label>
        <input
          type="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Подтвердите, что это вы"
        />
        <div className="form-text">
          Требуется отдельно от входа: украденной сессии для выгрузки базы
          недостаточно. Попытка — удачная или нет — попадёт в журнал аудита.
        </div>
      </div>

      {children({ database, password, info, setError, danger })}
    </div>
  );
}
