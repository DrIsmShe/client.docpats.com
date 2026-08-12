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
import ImportModePicker, { modeReady } from "./ImportModePicker";
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
  const [mode, setMode] = useState("add");
  const [confirm, setConfirm] = useState("");

  const run = async ({ database, password }) => {
    setError("");
    setResult(null);
    setBusy(true);
    try {
      setResult(await importDatabase({ database, password, file, mode }));
    } catch (err) {
      setError(await readError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminTransferShell
      title="Загрузить базу из файла"
      hint="Возвращает в базу ранее скачанную копию. Что делать с уже существующими записями — выбирается ниже."
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

          <ImportModePicker
            mode={mode}
            onMode={(m) => {
              setMode(m);
              setConfirm("");
            }}
            confirmWord={database}
            confirm={confirm}
            onConfirm={setConfirm}
          />

          <button
            className="btn btn-danger"
            disabled={
              busy || !file || !password || !modeReady(mode, database, confirm)
            }
            onClick={() => run({ database, password })}
          >
            {busy ? "Загрузка…" : "Загрузить в базу"}
          </button>

          {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}

          {result && (
            <div className="mt-3">
              <div className="alert alert-info py-2">
                Добавлено: <b>{result.insertedTotal}</b>
                {result.updatedTotal > 0 && (
                  <> · заменено: <b>{result.updatedTotal}</b></>
                )}
                {result.deletedTotal > 0 && (
                  <> · удалено: <b>{result.deletedTotal}</b></>
                )}
              </div>

              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Коллекция</th>
                    <th className="text-end">Добавлено</th>
                    <th className="text-end">Заменено</th>
                    <th className="text-end">Удалено</th>
                    <th className="text-end">Пропущено</th>
                    <th>Итог</th>
                  </tr>
                </thead>
                <tbody>
                  {result.report.map((r) => (
                    <tr key={r.collection}>
                      <td><code>{r.collection}</code></td>
                      <td className="text-end">{r.inserted}</td>
                      <td className="text-end">{r.updated || 0}</td>
                      <td className="text-end">{r.deleted || 0}</td>
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
