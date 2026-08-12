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

/**
 * @param {boolean} [pickTarget] на страницах загрузки база выбирается не
 *   списком, а кнопкой на каждую: «залить сюда» — это решение, а не настройка,
 *   и видеть все возможные цели сразу безопаснее, чем выбирать в выпадающем
 *   списке и потом гадать, что там осталось выбранным.
 */
export default function AdminTransferShell({
  title,
  hint,
  danger = false,
  pickTarget = false,
  children,
}) {
  const [databases, setDatabases] = useState([]);
  const [database, setDatabase] = useState("");
  const [appDatabase, setAppDatabase] = useState(null);
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatabases()
      .then((data) => {
        setDatabases(data.databases);
        setAppDatabase(data.appDatabase);
        setDatabase(data.databases[0]?.name || "");
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

      {/* Откуда берётся путаница: сервер, к которому вы подключены, может
          работать с одной базой, а выгружать — другую. На боевом сервере это
          одно и то же, на машине разработчика нет. Показываем прямо здесь. */}
      {appDatabase && (
        <div
          className={`alert py-2 small ${
            databases.some((d) => d.name === appDatabase)
              ? "alert-secondary"
              : "alert-warning"
          }`}
        >
          Сам сервер сейчас работает с базой <b>{appDatabase}</b>.
          {!databases.some((d) => d.name === appDatabase) && (
            <> Она отличается от тех, что ниже: вы переносите данные не той
            базы, на которой работает это приложение.</>
          )}
        </div>
      )}

      <div className="mb-3" hidden={pickTarget}>
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

      {info && !pickTarget && (
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

      {children({ database, password, info, setError, danger, databases, appDatabase })}
    </div>
  );
}
