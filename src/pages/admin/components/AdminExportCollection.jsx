// client/src/pages/admin/components/AdminExportCollection.jsx
//
// Выгрузка отдельных коллекций. Список приходит с сервера вместе с числом
// документов и объёмом — чтобы было видно, что именно скачиваешь, и с чем
// потом сверять.
//
// Формат файла тот же, что у полного дампа (объект с коллекциями, счётчиками и
// отметкой о завершении), поэтому такой файл загружается обратно тем же путём
// и с теми же проверками.

import { useState } from "react";

import AdminTransferShell from "./AdminTransferShell";
import { exportCollection, readError, humanSize } from "../../../api/adminTransfer";

export default function AdminExportCollection() {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const run = async ({ database, password, collection }) => {
    setError("");
    setBusy(collection);
    try {
      await exportCollection({ database, collection, password });
    } catch (err) {
      setError(await readError(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <AdminTransferShell
      title="Скачать отдельные коллекции"
      hint="По одной коллекции за раз — когда нужна не вся база."
    >
      {({ database, password, info }) => (
        <>
          {error && <div className="alert alert-danger py-2">{error}</div>}

          <input
            className="form-control mb-2"
            placeholder="Фильтр по названию"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {!info && <div className="text-muted small">Читаем состав базы…</div>}

          {info && (
            <div className="table-responsive" style={{ maxHeight: 460, overflowY: "auto" }}>
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Коллекция</th>
                    <th className="text-end">Документов</th>
                    <th className="text-end">Объём</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {info.collections
                    .filter((c) => c.name.includes(filter.trim()))
                    .map((c) => (
                      <tr key={c.name}>
                        <td>
                          <code>{c.name}</code>
                          {!c.importable && (
                            // Честно показываем асимметрию: скачать журнал
                            // аудита и пользователей можно, залить обратно —
                            // нет, и лучше узнать об этом здесь.
                            <span className="badge bg-secondary ms-2">
                              только выгрузка
                            </span>
                          )}
                        </td>
                        <td className="text-end">{c.count.toLocaleString("ru")}</td>
                        <td className="text-end text-muted">{humanSize(c.size)}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={!password || busy === c.name || !c.exportable}
                            onClick={() =>
                              run({ database, password, collection: c.name })
                            }
                          >
                            {busy === c.name ? "…" : "Скачать"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminTransferShell>
  );
}
