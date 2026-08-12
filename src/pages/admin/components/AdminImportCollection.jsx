// client/src/pages/admin/components/AdminImportCollection.jsx
//
// Загрузка одной коллекции из файла — когда нужно вернуть на место что-то
// одно, не трогая остальное.
//
// Список коллекций берётся ИЗ ФАЙЛА, а не из целевой базы: выбирать надо среди
// того, что в копии действительно есть, иначе легко указать коллекцию, которой
// в файле нет, и узнать об этом уже после отправки гигабайта.
//
// Читается для этого конец файла: там лежит "stats" с именами и числом
// документов. Конец, а не начало, — потому что счётчики пишутся последними,
// когда всё уже выгружено; а целиком гигабайтный файл в браузере не прочитать.
//
// База выбирается кнопкой на каждую: одну и ту же копию заливают и в боевую
// базу (восстановление), и в локальную (рабочая копия для разработки).

import { useState } from "react";

import AdminTransferShell from "./AdminTransferShell";
import ImportModePicker, { modeReady } from "./ImportModePicker";
import {
  importCollection,
  readError,
  IMPORT_MODES,
} from "../../../api/adminTransfer";

/** Что лежит в файле: откуда выгружен, какие коллекции, целый ли он. */
async function readManifest(file) {
  try {
    const head = await file.slice(0, 4096).text();
    const tailSize = Math.min(file.size, 256 * 1024);
    const tail = await file.slice(file.size - tailSize).text();

    const statsMatch = tail.match(/"stats":(\{.*?\}),\s*"completed"/s);
    const dbMatch = head.match(/"database":"([^"]+)"/);

    return {
      isOurs: head.includes('"format":"docpats-dump-v2"'),
      database: dbMatch ? dbMatch[1] : null,
      collections: statsMatch ? JSON.parse(statsMatch[1]) : null,
      completed: tail.includes('"completed":true'),
    };
  } catch {
    return { isOurs: false, database: null, collections: null, completed: false };
  }
}

export default function AdminImportCollection() {
  const [file, setFile] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [collection, setCollection] = useState("");
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("add");
  const [confirm, setConfirm] = useState("");

  const pickFile = async (picked) => {
    setFile(picked);
    setResult(null);
    setError("");
    setCollection("");
    setManifest(picked ? await readManifest(picked) : null);
  };

  const run = async ({ database, password }) => {
    const destructive = IMPORT_MODES.find((m) => m.value === mode)?.danger;
    const target = `${database}.${collection}`;
    // Подтверждается «база.коллекция», а не одно имя: очистить одну и ту же
    // коллекцию в боевой базе и в рабочей копии — разные по последствиям
    // действия, и подтверждение обязано их различать.
    if (destructive && confirm.trim() !== target) {
      setError(
        `Чтобы очистить «${target}», наберите это целиком в поле подтверждения.`,
      );
      return;
    }

    setError("");
    setResult(null);
    setBusy(database);
    try {
      setResult(
        await importCollection({ database, collection, password, file, mode }),
      );
    } catch (err) {
      setError(await readError(err));
    } finally {
      setBusy("");
    }
  };

  const names = manifest?.collections ? Object.keys(manifest.collections) : [];

  return (
    <AdminTransferShell
      pickTarget
      title="Загрузить одну коллекцию"
      hint="Из файла берётся только выбранная коллекция, остальное в нём игнорируется."
    >
      {({ password, databases }) => (
        <>
          <input
            type="file"
            accept=".json,application/json"
            className="form-control mb-2"
            onChange={(e) => pickFile(e.target.files?.[0] || null)}
          />

          {manifest && !manifest.isOurs && (
            <div className="alert alert-danger py-2 small">
              Это не файл выгрузки DocPats — загрузить его нельзя.
            </div>
          )}

          {manifest?.isOurs && (
            <div className="alert alert-secondary py-2 small">
              Файл выгружен из базы <b>{manifest.database}</b>.
              {!manifest.completed && (
                <span className="text-danger">
                  {" "}
                  В нём нет отметки о завершении — скорее всего, закачка
                  оборвалась. Сервер такой файл не примет.
                </span>
              )}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label small text-muted">
              Коллекция из файла
            </label>
            <select
              className="form-select"
              value={collection}
              disabled={names.length === 0}
              onChange={(e) => {
                setCollection(e.target.value);
                setConfirm("");
              }}
            >
              <option value="">
                {names.length === 0
                  ? "— сначала выберите файл —"
                  : "— выберите —"}
              </option>
              {names.map((name) => (
                <option key={name} value={name}>
                  {name} ({manifest.collections[name]})
                </option>
              ))}
            </select>
            <div className="form-text">
              Показано то, что есть в файле, с числом документов.
            </div>
          </div>

          <ImportModePicker
            mode={mode}
            onMode={(m) => {
              setMode(m);
              setConfirm("");
            }}
            confirmWord="база.коллекция — то, что очищаете"
            confirm={confirm}
            onConfirm={setConfirm}
          />

          <div className="d-flex flex-wrap gap-2">
            {databases.map((d) => (
              <button
                key={d.name}
                className={`btn ${d.phi ? "btn-danger" : "btn-primary"}`}
                disabled={
                  busy !== "" ||
                  !file ||
                  !password ||
                  !collection ||
                  manifest?.isOurs === false ||
                  !modeReady(mode, "", confirm)
                }
                onClick={() => run({ database: d.name, password })}
              >
                {busy === d.name ? "Загрузка…" : `Загрузить в ${d.name}`}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}

          {result?.report?.[0] && (
            <div className="alert alert-info mt-3 py-2">
              База <b>{result.database}</b>. Добавлено:{" "}
              <b>{result.report[0].inserted}</b>
              {result.report[0].updated > 0 && (
                <>
                  , заменено <b>{result.report[0].updated}</b>
                </>
              )}
              {result.report[0].deleted > 0 && (
                <>
                  , удалено <b>{result.report[0].deleted}</b>
                </>
              )}
              , пропущено {result.report[0].skipped}.
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
