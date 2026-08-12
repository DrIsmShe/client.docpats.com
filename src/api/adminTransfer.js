// client/src/api/adminTransfer.js
//
// Перенос данных через админку: выгрузка и загрузка базы или отдельных
// коллекций. Работает с /api/admin/transfer/*.
//
// ПОЧЕМУ ВЫГРУЗКА — POST. Она требует подтверждения паролем, а пароль в
// строке запроса оседает в журналах nginx, в истории браузера и в заголовке
// Referer. В теле POST-запроса он туда не попадает. Побочно это значит, что
// скачивание нельзя запустить одной ссылкой из чужой вкладки.

import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;
const ROOT = `${API_BASE}/api/admin/transfer`;

const withCreds = { withCredentials: true };

/** Какие базы можно выгружать. */
export async function fetchDatabases() {
  const { data } = await axios.get(`${ROOT}/databases`, withCreds);
  return data.databases;
}

/** Состав базы: коллекции, число документов, размер. */
export async function fetchCollections(database) {
  const { data } = await axios.get(`${ROOT}/collections`, {
    ...withCreds,
    params: { database },
  });
  return data;
}

/**
 * Скачивание. Ответ приходит потоком, поэтому берём его как blob целиком —
 * иначе браузер не соберёт файл.
 *
 * onProgress получает число уже полученных байт: у длинной выгрузки нет
 * заранее известного размера (сервер не может посчитать его, не собрав дамп
 * в памяти — ровно то, от чего уходили), поэтому показываем накопленное.
 */
async function download(url, payload, filename, onProgress) {
  const { data, headers } = await axios.post(url, payload, {
    ...withCreds,
    responseType: "blob",
    onDownloadProgress: (e) => onProgress?.(e.loaded),
  });

  // Имя файла сервер уже придумал (с базой и датой) — берём его, если отдал.
  const disposition = headers["content-disposition"] || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const name = match ? match[1] : filename;

  const href = window.URL.createObjectURL(new Blob([data], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(href);

  return { filename: name, size: data.size };
}

export function exportDatabase({ database, password }, onProgress) {
  return download(
    `${ROOT}/export-database`,
    { database, password },
    `${database}.json`,
    onProgress,
  );
}

export function exportCollection({ database, collection, password }, onProgress) {
  return download(
    `${ROOT}/export-collection`,
    { database, collection, password },
    `${database}-${collection}.json`,
    onProgress,
  );
}

/** Ошибка приходит blob'ом (responseType), поэтому её надо прочитать. */
export async function readError(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message;
    } catch {
      return "Не удалось прочитать ответ сервера";
    }
  }
  return data?.message || err.message || "Неизвестная ошибка";
}

// Режимы загрузки. Разница между ними — это разница между «дополнить»,
// «починить» и «стереть и залить заново», и цена ошибки у них разная.
export const IMPORT_MODES = [
  {
    value: "add",
    title: "Только добавить недостающее",
    hint: "Существующие записи не трогаются. Ничего не теряется — но и не исправляется: изменённые документы останутся какими были.",
    danger: false,
  },
  {
    value: "restore",
    title: "Восстановить из копии",
    hint: "Документ из файла замещает существующий. То, что появилось после выгрузки и в файле отсутствует, остаётся на месте.",
    danger: false,
  },
  {
    value: "replace",
    title: "Заменить содержимое коллекций",
    hint: "Коллекции из файла очищаются и наполняются заново. Единственный режим, дающий точное состояние на момент выгрузки — и единственный, в котором данные УДАЛЯЮТСЯ.",
    danger: true,
  },
];

async function upload(url, { database, collection, password, file, mode }) {
  const form = new FormData();
  form.append("file", file);
  form.append("database", database);
  form.append("password", password);
  form.append("mode", mode || "add");
  if (collection) form.append("collection", collection);

  const { data } = await axios.post(url, form, withCreds);
  return data;
}

export function importDatabase(args) {
  return upload(`${ROOT}/import-database`, args);
}

export function importCollection(args) {
  return upload(`${ROOT}/import-collection`, args);
}

/** Человеческий размер: 84.9 МБ понятнее, чем 89 012 345. */
export function humanSize(bytes) {
  if (!bytes) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
