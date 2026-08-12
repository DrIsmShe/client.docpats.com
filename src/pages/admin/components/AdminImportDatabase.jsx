// client/src/pages/admin/components/AdminImportDatabase.jsx
//
// Загрузка ранее выгруженного файла обратно в базу.
//
// Сервер отвечает построчным отчётом, и он показывается целиком, включая
// отказы. Это существенно: часть коллекций защищена от записи (журнал аудита,
// пользователи), и «загрузилось не всё» должно быть видно сразу, а не
// обнаруживаться потом по отсутствующим данным.

import { useState } from "react";

import AdminTransferShell from "./AdminTransferShell";
import { importDatabase, readError } from "../../../api/adminTransfer";

const STATUS = {
  ok: { label: "загружено", cls: "text-success" },
  partial: { label: "частично", cls: "text-warning" },
  refused: { label: "отказано", cls: "text-danger" },
  mismatch: { label: "не сходится", cls: "text-danger" },
  empty: { label: "пусто", cls: "text-muted" },
};

export default function AdminImportDatabase() {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async ({ database, password }) => {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      setResult(await importDatabase({ database, password, file }));
    } catch (err) {
      setError(await readError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminTransferShell
      title="Загрузить базу из файла"
      hint="Документы добавляются. Существующие записи не перезаписываются — совпадения по _id пропускаются."
    >
      {({ database, password }) => (
        <>
          <div className="alert alert-warning py-2 small">
            Загрузка пишет в базу напрямую. Журнал аудита и пользователей
            записать нельзя: журнал должен оставаться доказательством, а
            пользователь с ролью администратора, заведённый файлом, — это
            скрытый вход, переживающий смену пароля.
          </div>

          <input
            type="file"
            accept=".json,application/json"
            className="form-control mb-3"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            className="btn btn-danger"
            disabled={busy || !file || !password}
            onClick={() => run({ database, password })}
          >
            {busy ? "Загрузка…" : "Загрузить в базу"}
          </button>

          {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}

          {result && (
            <div className="mt-3">
              <div className="alert alert-info py-2">
                Записано документов: <b>{result.insertedTotal}</b>
                {result.warning && <div className="small mt-1">{result.warning}</div>}
              </div>

              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Коллекция</th>
                    <th className="text-end">Записано</th>
                    <th className="text-end">Пропущено</th>
                    <th>Итог</th>
                  </tr>
                </thead>
                <tbody>
                  {result.report.map((r) => (
                    <tr key={r.collection}>
                      <td><code>{r.collection}</code></td>
                      <td className="text-end">{r.inserted}</td>
                      <td className="text-end">{r.skipped}</td>
                      <td className={STATUS[r.status]?.cls || ""}>
                        {STATUS[r.status]?.label || r.status}
                        {r.reason && (
                          <div className="small text-muted">{r.reason}</div>
                        )}
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
