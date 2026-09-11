// client/src/pages/admin/components/AdminExportCollection.jsx
//
// Выгрузка отдельных коллекций. Список приходит с сервера вместе с числом
// документов и объёмом — чтобы было видно, что именно скачиваешь, и с чем
// потом сверять.
//
// Формат файла тот же, что у полного дампа (объект с коллекциями, счётчиками и
// отметкой о завершении), поэтому такой файл загружается обратно тем же путём
// и с теми же проверками.

import { useEffect, useState } from "react";

import AdminTransferShell from "./AdminTransferShell";
import {
  exportCollection,
  fetchCollections,
  readError,
  humanSize,
} from "../../../api/adminTransfer";

/**
 * Подробный состав базы — СВОИМ запросом.
 *
 * ЗДЕСЬ БЫЛА ОШИБКА «Cannot read properties of undefined (reading 'filter')».
 *
 * Оболочка AdminTransferShell берёт у сервера СВОДКУ (?summary=1): три
 * числа одной командой dbStats. Так сделано намеренно — перебор двух
 * сотен коллекций ради счётчиков занимал сорок пять секунд, и всё это
 * время страница выглядела сломанной.
 *
 * Но в сводке нет поля collections: dbStats его не возвращает. А этой
 * странице нужен именно список — по нему и выбирают, что скачать. Она
 * читала info.collections, получала undefined и падала на .filter.
 * Страница была сломана ровно с того дня, когда оболочку перевели на
 * сводку.
 *
 * Список запрашивается здесь, а не в оболочке, потому что нужен он
 * только здесь: остальные страницы переноса работают с базой целиком, и
 * платить за обход коллекций им незачем.
 */
/* Имя латиницей не по вкусу, а по правилу eslint react-hooks: оно ищет
   /^use[A-Z]/, и кириллическое «С» под это не подходит — сборка падала
   с rules-of-hooks. Комментарии остаются на языке файла. */
function useCollectionList(database) {
  const [состав, setСостав] = useState(null);
  const [ошибка, setОшибка] = useState("");

  useEffect(() => {
    if (!database) return undefined;
    let живо = true;
    setСостав(null);
    setОшибка("");

    fetchCollections(database)
      .then((d) => {
        if (живо) setСостав(Array.isArray(d?.collections) ? d.collections : []);
      })
      .catch(() => {
        if (живо) setОшибка("Не удалось прочитать список коллекций");
      });

    return () => {
      живо = false;
    };
  }, [database]);

  return { состав, ошибка };
}

export default function AdminExportCollection() {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [база, setБаза] = useState("");
  const { состав, ошибка: ошибкаСостава } = useCollectionList(база);

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
      {({ database, password }) => (
        <>
          {/* Оболочка знает выбранную базу, а состав тянем мы — держим их
              в согласии здесь, а не прокидываем колбэк наружу. */}
          <DatabaseSync database={database} set={setБаза} />

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {ошибкаСостава && (
            <div className="alert alert-danger py-2">{ошибкаСостава}</div>
          )}

          <input
            className="form-control mb-2"
            placeholder="Фильтр по названию"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />

          {!состав && !ошибкаСостава && (
            <div className="text-muted small">Читаем состав базы…</div>
          )}

          {состав && состав.length === 0 && (
            <div className="text-muted small">В этой базе нет коллекций.</div>
          )}

          {состав && состав.length > 0 && (
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
                  {состав
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

/* Пробрасывает выбранную в оболочке базу наружу.
 *
 * Компонент без разметки: оболочка отдаёт database через children, а
 * состав нужен в состоянии страницы. Эффект вместо setState прямо в
 * рендере — иначе React ругается на обновление во время отрисовки. */
function DatabaseSync({ database, set }) {
  useEffect(() => {
    set(database || "");
  }, [database, set]);
  return null;
}
