// client/src/pages/patientProfilePages/labInsight/LabInsightPage.jsx
//
// Расшифровка анализов: пациент фотографирует бланк — получает
// объяснение простыми словами.
//
// ЧТО ЭТОТ ЭКРАН ОБЯЗАН ДЕЛАТЬ, И ЧЕГО НЕ ДЕЛАЕТ НИКОГДА
//
// Человек открывает его, волнуясь: у него на руках бумага с цифрами, из
// которой он понял только то, что где-то звёздочка. Поэтому:
//
//   — отклонения показываются ПЕРВЫМИ и отделены от нормы;
//   — рядом с каждым выводом стоят исходные числа и норма с бланка,
//     чтобы вывод можно было проверить глазами, а не принять на веру;
//   — непрочитанные строки показываются отдельным блоком: молча
//     пропущенная строка опаснее отказа;
//   — нигде не написано «всё в порядке» и «ничего страшного». Такое
//     обещание давать не на чем, и оно уводит человека от врача.
//
// Диагнозов и советов по лечению здесь нет — их запрещает промпт, но
// экран устроен так, чтобы их отсутствие не выглядело недоделкой:
// заключение всегда заканчивается тем, к какому врачу идти.

import { useCallback, useEffect, useRef, useState } from "react";
import axios from "../../../axios";
import "./labInsight.css";

const API = "/api/v1/lab-insight";

// Слова уровня — здесь, а не на сервере: сервер отдаёт факт (насколько
// вышло за границу), экран выбирает, как это назвать человеку.
const LEVEL = {
  far: { label: "заметно за пределами нормы", tone: "far" },
  out: { label: "за пределами нормы", tone: "out" },
  borderline: { label: "у границы нормы", tone: "borderline" },
  normal: { label: "в пределах нормы", tone: "normal" },
  unknown: { label: "норма на бланке не указана", tone: "unknown" },
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("ru-RU") : null;
}

function ParamCard({ p }) {
  const level = LEVEL[p.level] || LEVEL.unknown;
  const arrow = p.direction === "high" ? "↑" : p.direction === "low" ? "↓" : "";

  return (
    <article className={`li-param li-param--${level.tone}`}>
      <header className="li-param__head">
        <h3 className="li-param__name">{p.name}</h3>
        <div className="li-param__value">
          {arrow && <span className="li-param__arrow">{arrow}</span>}
          {p.rawValue}
          {p.unit ? ` ${p.unit}` : ""}
        </div>
      </header>

      <p className="li-param__level">
        {level.label}
        {/* Норма с бланка рядом с выводом — чтобы вывод можно было
            проверить, а не принять на веру. */}
        {p.refText ? (
          <span className="li-param__ref"> · норма по бланку {p.refText}</span>
        ) : null}
      </p>

      {p.whatItIs && <p className="li-param__what">{p.whatItIs}</p>}
      {p.whatItMeans && <p className="li-param__means">{p.whatItMeans}</p>}
    </article>
  );
}

export default function LabInsightPage() {
  const [items, setItems] = useState([]);
  const [quota, setQuota] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [list, q] = await Promise.all([
        axios.get(API),
        axios.get(`${API}/quota`),
      ]);
      setItems(list.data.items || []);
      setQuota(q.data.quota || null);
      if (!openId && list.data.items?.length) {
        setOpenId(list.data.items[0].id);
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? "Не удалось загрузить разборы");
    }
  }, [openId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axios.post(API, form);
      setItems((prev) => [data.insight, ...prev]);
      setOpenId(data.insight.id);
      // Квоту перечитываем, а не считаем на клиенте: окно скользящее,
      // и клиентская арифметика однажды разойдётся с серверной.
      const q = await axios.get(`${API}/quota`);
      setQuota(q.data.quota || null);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Не удалось разобрать бланк");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id) {
    if (!window.confirm("Удалить этот разбор?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err?.response?.data?.message ?? "Не удалось удалить");
    }
  }

  const open = items.find((i) => i.id === openId) || null;
  const abnormal = open
    ? open.parameters.filter((p) => p.level === "out" || p.level === "far")
    : [];
  const borderline = open
    ? open.parameters.filter((p) => p.level === "borderline")
    : [];
  const normal = open
    ? open.parameters.filter((p) => p.level === "normal")
    : [];
  const unknown = open
    ? open.parameters.filter((p) => p.level === "unknown")
    : [];

  return (
    <div className="li-page">
      <header className="li-head">
        <h1>Расшифровка анализов</h1>
        <p className="li-lead">
          Сфотографируйте бланк — покажем, какие показатели вне нормы и что
          они означают. Это не диагноз и не назначение: с результатом нужно
          прийти к врачу.
        </p>
      </header>

      <section className="li-upload">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          disabled={busy}
          onChange={(e) => upload(e.target.files?.[0])}
          id="li-file"
          className="li-file"
        />
        <label htmlFor="li-file" className="li-btn">
          {busy ? "Разбираем бланк…" : "Загрузить фото или PDF"}
        </label>

        {quota && !quota.unlimited && (
          <span className="li-quota">
            осталось {quota.left} из {quota.limit} за 30 дней
          </span>
        )}
      </section>

      {error && <p className="li-error">{error}</p>}

      {items.length > 1 && (
        <nav className="li-tabs">
          {items.map((i) => (
            <button
              key={i.id}
              type="button"
              className={`li-tab ${i.id === openId ? "is-active" : ""}`}
              onClick={() => setOpenId(i.id)}
            >
              {fmtDate(i.collectedAt || i.createdAt)}
              {i.summary.outOfRange > 0 && (
                <span className="li-tab__dot" title="есть отклонения" />
              )}
            </button>
          ))}
        </nav>
      )}

      {open && (
        <section className="li-result">
          <p className="li-overview">{open.overview}</p>

          {/* Непрочитанное — до всего остального. Человек должен знать,
              что часть бланка в разбор не попала. */}
          {open.unreadable.length > 0 && (
            <div className="li-unreadable">
              <strong>Не удалось прочитать:</strong>
              <ul>
                {open.unreadable.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
              <p>Эти строки в разбор не вошли — покажите бланк врачу целиком.</p>
            </div>
          )}

          {abnormal.length > 0 && (
            <>
              <h2 className="li-group">Вне нормы</h2>
              <div className="li-params">
                {abnormal.map((p) => (
                  <ParamCard key={p.name} p={p} />
                ))}
              </div>
            </>
          )}

          {borderline.length > 0 && (
            <>
              <h2 className="li-group">У границы нормы</h2>
              <div className="li-params">
                {borderline.map((p) => (
                  <ParamCard key={p.name} p={p} />
                ))}
              </div>
            </>
          )}

          {unknown.length > 0 && (
            <>
              <h2 className="li-group">Сравнить не с чем</h2>
              <p className="li-note">
                На бланке рядом с этими показателями не напечатана норма.
                Подставлять «обычную» нельзя: у разных лабораторий нормы
                различаются, и вывод получился бы неверным.
              </p>
              <div className="li-params">
                {unknown.map((p) => (
                  <ParamCard key={p.name} p={p} />
                ))}
              </div>
            </>
          )}

          {normal.length > 0 && (
            <>
              <h2 className="li-group">В пределах нормы</h2>
              <div className="li-params">
                {normal.map((p) => (
                  <ParamCard key={p.name} p={p} />
                ))}
              </div>
            </>
          )}

          <footer className="li-footer">
            <p className="li-seedoctor">{open.seeDoctor}</p>
            <button
              type="button"
              className="li-btn li-btn--ghost"
              onClick={() => remove(open.id)}
            >
              Удалить разбор
            </button>
          </footer>
        </section>
      )}

      {!open && !busy && (
        <p className="li-empty">
          Пока ничего не разобрано. Загрузите бланк — фотография не
          сохраняется, в вашем профиле останутся только показатели.
        </p>
      )}
    </div>
  );
}
