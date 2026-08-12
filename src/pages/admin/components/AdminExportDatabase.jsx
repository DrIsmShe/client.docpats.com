// client/src/pages/admin/components/AdminExportDatabase.jsx
//
// Выгрузка базы целиком.
//
// Скачивание идёт потоком, поэтому заранее известного размера у ответа нет:
// сервер не может его посчитать, не собрав дамп в памяти — ровно то, от чего
// уходили. Показываем накопленные байты, чтобы было видно, что процесс идёт,
// а не завис.

import { useState } from "react";

import AdminTransferShell from "./AdminTransferShell";
import { exportDatabase, readError, humanSize } from "../../../api/adminTransfer";

export default function AdminExportDatabase() {
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const run = async ({ database, password }) => {
    setError("");
    setDone(null);
    setLoaded(0);
    setBusy(true);
    try {
      const result = await exportDatabase({ database, password }, setLoaded);
      setDone(result);
    } catch (err) {
      setError(await readError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminTransferShell
      title="Скачать базу целиком"
      hint="Все коллекции одним файлом. Сессии не выгружаются — это живые ключи доступа."
    >
      {/* Замеры на боевых базах: платформа ~95 МБ, новости ~1 ГБ (документов
          меньше, но это полные тексты статей). Гигабайтный файл браузер
          собирает в памяти вкладки — предупреждаем заранее. */}
      {({ database, password }) => (
        <>
          <button
            className="btn btn-danger"
            disabled={busy || !password}
            onClick={() => run({ database, password })}
          >
            {busy ? "Скачивание…" : "📦 Скачать всю базу"}
          </button>

          {busy && (
            <div className="mt-3 small text-muted">
              Получено: {humanSize(loaded)} — не закрывайте вкладку.
            </div>
          )}

          {done && (
            <div className="alert alert-success mt-3 py-2">
              Готово: <b>{done.filename}</b>, {humanSize(done.size)}.
              <div className="small mt-1">
                {/* Признак полноты — часть самого файла, а не обещание
                    интерфейса: обрезанная закачка не пройдёт проверку при
                    загрузке обратно. */}
                Файл заканчивается отметкой о завершении и счётчиками по
                коллекциям — по ним загрузка проверит, что скачалось всё.
              </div>
            </div>
          )}

          {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}
        </>
      )}
    </AdminTransferShell>
  );
}
