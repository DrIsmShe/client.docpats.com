// client/src/pages/admin/components/AdminImportDatabase.jsx
//
// Загрузка ранее скачанного файла обратно в базу.
//
// База выбирается КНОПКОЙ на каждую, а не выпадающим списком: файл скачивается
// один раз, а залить его можно в разные базы — боевую (восстановление) и
// локальную (рабочая копия для разработки). Видеть обе цели сразу безопаснее,
// чем выбрать в списке и потом гадать, что там осталось выбранным.
//
// Откуда файл — читается из него самого: в начале дампа записано имя базы.
// Читаем первые килобайты, а не файл целиком: он бывает и на гигабайт.

import { useState } from "react";

import AdminTransferShell from "./AdminTransferShell";
import ImportModePicker, { modeReady } from "./ImportModePicker";
import { importDatabase, readError, IMPORT_MODES } from "../../../api/adminTransfer";

const STATUS = {
  ok: { label: "загружено", cls: "text-success" },
  partial: { label: "частично", cls: "text-warning" },
  refused: { label: "отказано", cls: "text-danger" },
  mismatch: { label: "не сходится", cls: "text-danger" },
  empty: { label: "пусто", cls: "text-muted" },
};

/** Имя базы из начала файла — по нему видно, что именно вы собираетесь залить. */
async function readSourceDatabase(file) {
  try {
    const head = await file.slice(0, 4096).text();
    const match = head.match(/"database":"([^"]+)"/);
    return {
      database: match ? match[1] : null,
      isOurs: head.includes('"format":"docpats-dump-v2"'),
    };
  } catch {
    return { database: null, isOurs: false };
  }
}

export default function AdminImportDatabase() {
  const [file, setFile] = useState(null);
  const [source, setSource] = useState(null);
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("add");
  const [confirm, setConfirm] = useState("");

  const pickFile = async (picked) => {
    setFile(picked);
    setResult(null);
    setError("");
    setSource(picked ? await readSourceDatabase(picked) : null);
  };

  const run = async ({ database, password }) => {
    const destructive = IMPORT_MODES.find((m) => m.value === mode)?.danger;
    // Подтверждение — это имя базы, В КОТОРУЮ заливаем. Когда кнопок
    // несколько, набранное имя и выбирает, какая из них разрешена: нельзя
    // подтвердить одну базу, а нажать на другую.
    if (destructive && confirm.trim() !== database) {
      setError(
        `Чтобы очистить «${database}», наберите это имя в поле подтверждения.`,
      );
      return;
    }

    setError("");
    setResult(null);
    setBusy(database);
    try {
      setResult(await importDatabase({ database, password, file, mode }));
    } catch (err) {
      setError(await readError(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <AdminTransferShell
      pickTarget
      title="Загрузить базу из файла"
      hint="Возвращает ранее скачанную копию. Одну и ту же копию можно залить в разные базы — выберите кнопкой, куда."
    >
      {({ password, databases }) => (
        <>
          <div className="alert alert-warning py-2 small">
            Загрузка пишет в базу напрямую. Журнал аудита и сессии записать
            нельзя: журнал должен оставаться доказательством, а сессии — это
            живые ключи доступа.
          </div>

          <input
            type="file"
            accept=".json,application/json"
            className="form-control mb-2"
            onChange={(e) => pickFile(e.target.files?.[0] || null)}
          />

          {source && (
            <div
              className={`alert py-2 small ${
                source.isOurs ? "alert-secondary" : "alert-danger"
              }`}
            >
              {source.isOurs ? (
                <>
                  Файл выгружен из базы <b>{source.database}</b>.
                </>
              ) : (
                <>
                  Это не файл выгрузки DocPats — загрузить его нельзя. Скачайте
                  копию через «Экспорт БД».
                </>
              )}
            </div>
          )}

          <ImportModePicker
            mode={mode}
            onMode={(m) => {
              setMode(m);
              setConfirm("");
            }}
            confirmWord="имя базы, в которую заливаете"
            confirm={confirm}
            onConfirm={setConfirm}
          />

          <div className="d-flex flex-wrap gap-2">
            {databases.map((d) => (
              <button
                key={d.name}
                className={`btn ${d.phi ? "btn-danger" : "btn-primary"}`}
                disabled={busy !== "" || !file || !password || source?.isOurs === false}
                onClick={() => run({ database: d.name, password })}
              >
                {busy === d.name ? "Загрузка…" : `Загрузить в ${d.name}`}
              </button>
            ))}
          </div>

          {/* Заливка копии в базу с другим именем — обычное дело (боевая копия
              в локальную), а вот копия платформы в базу новостей это почти
              наверняка ошибка: там другой набор коллекций. */}
          {source?.database && (
            <div className="form-text mt-2">
              Копия из <b>{source.database}</b>. Заливать её в базу с другим
              именем можно — так и делают рабочую копию для разработки, — но
              убедитесь, что это та база, которую вы имели в виду.
            </div>
          )}

          {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}

          {result && (
            <div className="mt-3">
              <div className="alert alert-info py-2">
                База <b>{result.database}</b>. Добавлено:{" "}
                <b>{result.insertedTotal}</b>
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
