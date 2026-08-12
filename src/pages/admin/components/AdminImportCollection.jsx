// client/src/pages/admin/components/AdminImportCollection.jsx
//
// Загрузка одной коллекции из файла. Отличается от загрузки базы только тем,
// что из файла берётся одна названная коллекция — удобно, когда нужно вернуть
// на место что-то одно, не трогая остальное.
//
// Название выбирается из состава базы, а не вводится руками: опечатка создала
// бы новую коллекцию с похожим именем, и данные ушли бы в никуда, отчитавшись
// об успехе.

import { useState } from "react";

import AdminTransferShell from "./AdminTransferShell";
import { importCollection, readError } from "../../../api/adminTransfer";

export default function AdminImportCollection() {
  const [file, setFile] = useState(null);
  const [collection, setCollection] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async ({ database, password }) => {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      setResult(await importCollection({ database, collection, password, file }));
    } catch (err) {
      setError(await readError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminTransferShell
      title="Загрузить одну коллекцию"
      hint="Из файла берётся только выбранная коллекция, остальное в нём игнорируется."
    >
      {({ database, password, info }) => (
        <>
          <div className="mb-3">
            <label className="form-label small text-muted">Коллекция</label>
            <select
              className="form-select"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
            >
              <option value="">— выберите —</option>
              {(info?.collections || [])
                .filter((c) => c.importable)
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count.toLocaleString("ru")})
                  </option>
                ))}
            </select>
            <div className="form-text">
              Защищённые от записи коллекции в списке не показаны.
            </div>
          </div>

          <input
            type="file"
            accept=".json,application/json"
            className="form-control mb-3"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            className="btn btn-danger"
            disabled={busy || !file || !password || !collection}
            onClick={() => run({ database, password })}
          >
            {busy ? "Загрузка…" : "Загрузить коллекцию"}
          </button>

          {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}

          {result?.report?.[0] && (
            <div className="alert alert-info mt-3 py-2">
              Записано: <b>{result.report[0].inserted}</b>, пропущено{" "}
              {result.report[0].skipped}.
              {result.report[0].reason && (
                <div className="small mt-1">{result.report[0].reason}</div>
              )}
            </div>
          )}
        </>
      )}
    </AdminTransferShell>
  );
}
