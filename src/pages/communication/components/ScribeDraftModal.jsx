// client/src/pages/communication/components/ScribeDraftModal.jsx
//
// Черновик приёма, собранный из разговора: врач правит и сохраняет.
//
// ПОЯВЛЯЕТСЯ СРАЗУ ПОСЛЕ ЗАПИСИ, а не ждёт, когда врач откроет карту.
// Пока приём в памяти, правки занимают минуту; через час — полчаса, а
// через день черновик станет чужим текстом, который проще переписать
// заново. Инструмент, экономящий время, обязан приходить вовремя.
//
// ─── ЧТО ЗДЕСЬ УСТРОЕНО НАМЕРЕННО ───────────────────────────────────
//
// ПОЛЯ РЕДАКТИРУЕМЫ ВСЕ. Черновик — предложение, а не результат.
// Сохраняется то, что осталось в полях после правки врача, а не то, что
// собрала модель.
//
// «НЕ ПРОЗВУЧАЛО» — ОТДЕЛЬНЫМ БЛОКОМ И СВЕРХУ. Это главное, что модель
// может сказать полезного: чего в разговоре не было. Врач не станет
// искать пропуск, о котором не знает, а список пропусков превращает
// черновик из «перечитай и поверь» в «допиши недостающее».
//
// РАСШИФРОВКА РЯДОМ, ПОД СПОЙЛЕРОМ. Черновик без первоисточника нечем
// проверить, а развёрнутая расшифровка забирает весь экран.
//
// ЗАКРЫТЬ БЕЗ СОХРАНЕНИЯ МОЖНО. Навязанный диалог, из которого нет
// выхода, кончается тем, что в карту попадает непроверенный текст.

import { useEffect, useState } from "react";
import axios from "../../../axios";
import { searchPatients, createPatient } from "../../../api/clinic";
import "./scribeDraftModal.css";

// Языки, на которые умеем переводить: те же, что у интерфейса.
// Перевод на язык, которого нет в интерфейсе, некому будет прочитать.
const LANGS = [
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
  { code: "az", label: "Azərbaycanca" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
];

const FIELDS = [
  { key: "complaints", label: "Жалобы", rows: 3 },
  { key: "anamnesisMorbi", label: "Анамнез заболевания", rows: 3 },
  { key: "anamnesisVitae", label: "Анамнез жизни", rows: 2 },
  { key: "statusPreasens", label: "Объективный осмотр", rows: 3 },
  { key: "diagnosisText", label: "Диагноз", rows: 2 },
  { key: "recommendations", label: "Назначения и рекомендации", rows: 3 },
];

export default function ScribeDraftModal({ data, onClose }) {
  const [values, setValues] = useState(() => {
    const d = data?.draft || {};
    const out = {};
    for (const f of FIELDS) out[f.key] = d[f.key] || "";
    return out;
  });
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [saved, setSaved] = useState(false);
  // id созданной записи — чтобы открыть именно её, а не искать по карте.
  const [savedId, setSavedId] = useState(null);
  const [translating, setTranslating] = useState(false);

  // Поиск карты, когда её не нашли по аккаунту. Нужен для звонков из
  // переписки: приёма нет, значит и карты может не быть — пациент
  // обратился в клинику впервые.
  const [query, setQuery] = useState("");
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  // Куда сохраняем: в карту клиники или в карту частной практики.
  //
  // Врач об этом думать не должен — он просто ведёт приём. Определяем
  // сами: сначала пробуем клинику, и если её нет (частный врач, у него
  // нет арендатора), переходим на частный путь.
  const [target, setTarget] = useState(null); // "clinic" | "private"
  const [privateType, setPrivateType] = useState(null);

  // Карта пациента.
  //
  // Два пути, и первый ЛУЧШЕ второго:
  //
  //   patientRef пришёл с сервера — приём знал карту заранее (телемед).
  //   Это достоверные данные, искать нечего;
  //
  //   не пришёл — звонок из переписки, ищем по аккаунту участника.
  //   Поиск может не найти: карта не связана с аккаунтом или пациент в
  //   клинике впервые.
  //
  // В обоих случаях врач не должен вписывать 24-символьный
  // идентификатор, которого он нигде не видит.
  useEffect(() => {
    if (data?.patientRef) {
      setPatientId(data.patientRef);
      // Имя подтянем тем же запросом, если знаем аккаунт; если нет —
      // покажем хотя бы то, что карта определена приёмом.
      setPatientName((prev) => prev || "определена приёмом");
    }
  }, [data?.patientRef]);

  useEffect(() => {
    // Приём уже дал карту — поиск не нужен и может только запутать,
    // подставив другую.
    if (data?.patientRef) {
      setTarget("clinic");
      return;
    }
    const uid = data?.patientUserId;
    if (!uid) return;

    let cancelled = false;

    // Сначала клиника. Отказ здесь означает не поломку, а отсутствие
    // клиники у этого врача, — и тогда путь другой, а не тупик.
    axios
      .get(`/api/v1/clinic/medical/patients/by-user/${uid}`)
      .then((r) => {
        if (cancelled) return;
        setTarget("clinic");
        const p = r.data?.patient;
        if (!p) return;
        setPatientId(p.id);
        setPatientName(`${p.lastName} ${p.firstName}`.trim());
      })
      .catch(() =>
        axios
          .get(`/api/v1/scribe/private-patient/by-user/${uid}`)
          .then((r) => {
            if (cancelled) return;
            setTarget("private");
            const p = r.data?.patient;
            if (!p) return;
            setPatientId(p.id);
            setPrivateType(p.patientTypeModel);
            setPatientName(
              `${p.lastName || ""} ${p.firstName || ""}`.trim() ||
                "ваш пациент",
            );
          })
          .catch(() => {
            // Ни там, ни там. Оставляем ручной путь: молчаливый отказ
            // хуже видимого поля.
          }),
      );

    return () => {
      cancelled = true;
    };
  }, [data?.patientUserId, data?.patientRef]);

  async function runSearch() {
    const q = query.trim();
    if (q.length < 2) {
      setNotice("Введите фамилию, телефон или почту");
      return;
    }
    setSearching(true);
    setNotice(null);
    try {
      // Что искать — решаем по виду строки, а не заставляем врача
      // выбирать поле: он ищет человека, а не заполняет форму.
      const isPhone = /^[+\d][\d\s()-]{4,}$/.test(q);
      const isEmail = q.includes("@");
      const res = await searchPatients(
        isPhone ? { phone: q } : isEmail ? { email: q } : { lastName: q },
      );
      setFound(res.items || []);
    } catch (err) {
      setNotice(err?.response?.data?.message ?? "Поиск не удался");
    } finally {
      setSearching(false);
    }
  }

  async function createCard() {
    const name = (data?.patientName || "").trim().split(/\s+/);
    setCreating(true);
    setNotice(null);
    try {
      const res = await createPatient({
        firstName: name[1] || "Пациент",
        lastName: name[0] || "Без фамилии",
        // Аккаунт пациенту НЕ выпускаем: он у него уже есть — он в
        // звонке. Выпустить второй значило бы развести одного человека
        // на две учётные записи.
        createProvisionalUser: false,
      });
      const created = res.patient || res;
      setPatientId(created.id || created._id);
      setPatientName(`${created.lastName || ""} ${created.firstName || ""}`.trim());
      setFound(null);
    } catch (err) {
      setNotice(
        err?.response?.data?.message ??
          "Не удалось завести карту. Заведите её в разделе «Пациенты» и вернитесь.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function translate(to) {
    setTranslating(true);
    setNotice(null);
    try {
      const { data: res } = await axios.post(
        `/api/v1/scribe/sessions/${data.sessionId}/translate`,
        { to, fields: values },
      );
      // Подставляем перевод В ПОЛЯ: врач видит результат и может его
      // поправить перед сохранением, как и любой другой текст здесь.
      setValues((v) => ({ ...v, ...res.fields }));
    } catch (err) {
      setNotice(err?.response?.data?.message ?? "Не удалось перевести");
    } finally {
      setTranslating(false);
    }
  }

  const notHeard = data?.draft?.notHeard || [];
  const other = data?.draft?.other || [];
  const dialogue = data?.dialogue || [];

  async function save() {
    if (!patientId.trim()) {
      setNotice("Укажите карту пациента, в которую сохранить запись");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      // Идентификатор СОЗДАННОЙ записи запоминаем и показываем ссылкой.
      //
      // Сохранение всегда СОЗДАЁТ новую запись, а не дописывает открытую.
      // Без ссылки врач шёл искать её сам и открывал соседнюю — ту, что
      // была в карте раньше. Выглядело это как «сохранил одно, в истории
      // болезни другое», хотя сохранённое лежало рядом нетронутым.
      let createdId = null;

      if (target === "private") {
        // Частная практика: своя карта, свой путь, клиники в записи нет.
        const { data: res } = await axios.post(
          `/api/v1/scribe/sessions/${data.sessionId}/save-private`,
          {
            patientRef: patientId.trim(),
            patientTypeModel: privateType || "NewPatientPolyclinic",
            fields: values,
          },
        );
        // Ссылку даём только на поликлиническую карту: страница просмотра
        // подтягивает пациента как NewPatientPolyclinic и на записи другого
        // типа отвечает 404. Вести врача в тупик хуже, чем не вести никуда.
        if ((privateType || "NewPatientPolyclinic") === "NewPatientPolyclinic") {
          createdId = res?.encounterId ?? null;
        }
      } else {
        await axios.post(
          `/api/v1/clinic/medical/patients/${patientId.trim()}/from-scribe/${data.sessionId}`,
          values,
        );
      }

      setSavedId(createdId);
      setSaved(true);
    } catch (err) {
      setNotice(err?.response?.data?.message ?? "Не удалось сохранить запись");
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <div className="sdm-overlay" role="dialog" aria-modal="true">
        <div className="sdm">
          <h2>Черновик сохранён в карту</h2>
          <p className="sdm-lead">
            Создана НОВАЯ запись — прежние в карте не изменились. Подпишите
            её, когда перечитаете.
          </p>
          <div className="sdm-actions">
            {savedId && (
              // Ссылка именно на созданную запись. Искать её в карте
              // глазами — верный способ открыть соседнюю и решить, что
              // сохранилось не то.
              <a
                className="sdm-open"
                href={`/dp/patient-polyclinic-medical-history/${savedId}`}
                target="_blank"
                rel="noreferrer"
              >
                Открыть запись
              </a>
            )}
            <button type="button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sdm-overlay" role="dialog" aria-modal="true">
      <div className="sdm">
        <h2>Черновик приёма</h2>
        <p className="sdm-lead">
          Собран из разговора. Проверьте и поправьте — в карту попадёт то,
          что останется в полях. Запись сохранится черновиком, подпись —
          отдельным действием.
        </p>

        {/* Чего в разговоре не было — до полей, а не после: это то,
            что врачу предстоит дописать. */}
        {notHeard.length > 0 && (
          <div className="sdm-gaps">
            <strong>В разговоре не прозвучало:</strong>
            <ul>
              {notHeard.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Прозвучало, но не разложилось по разделам.
            ГЛАВНЫЙ БЛОК ЭТОГО ОКНА после самих полей.

            Разговор на приёме идёт вперемешку — симптом, лекарство,
            снова «когда началось», «да, было» в ответ на вопрос двумя
            репликами выше. Шесть разделов это форма КАРТЫ, а не форма
            РЕЧИ, и часть сказанного в них не укладывается никогда.

            Такое нельзя терять молча: врач перестанет перечитывать
            расшифровку и не хватится пропавшего. Поэтому — отдельным
            блоком, дословно, чтобы он сам решил, куда это отнести. */}
        {other.length > 0 && (
          <div className="sdm-other">
            <strong>Прозвучало, но не разложилось по разделам:</strong>
            <ul>
              {other.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
            <p>
              Перенесите в нужные поля то, что относится к приёму. Мы не
              стали угадывать раздел: ошибиться разделом хуже, чем оставить
              выбор врачу.
            </p>
          </div>
        )}

        {/* Перевод — отдельным действием и ПОСЛЕ правки: черновик
            собран на языке разговора, и врач сначала сверяет его с тем,
            что помнит, а переводит уже проверенное. */}
        <div className="sdm-translate">
          <span>Перевести черновик:</span>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              className="sdm-lang"
              disabled={translating || busy}
              onClick={() => translate(l.code)}
            >
              {l.label}
            </button>
          ))}
          {translating && <span className="sdm-translating">переводим…</span>}
        </div>

        <div className="sdm-fields">
          {FIELDS.map((f) => (
            <label key={f.key} className="sdm-field">
              <span>{f.label}</span>
              <textarea
                rows={f.rows}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                placeholder="не прозвучало"
              />
            </label>
          ))}
        </div>

        {dialogue.length > 0 && (
          <details className="sdm-transcript">
            <summary>Расшифровка разговора ({dialogue.length} реплик)</summary>
            <ul>
              {dialogue.map((d, i) => (
                <li key={i} className={`sdm-line sdm-line--${d.speaker}`}>
                  <strong>{d.speaker === "doctor" ? "Врач" : "Пациент"}:</strong>{" "}
                  {d.text}
                </li>
              ))}
            </ul>
          </details>
        )}

        <label className="sdm-field sdm-field--patient">
          <span>
            Карта пациента
            {patientName && (
              <b className="sdm-patient-name"> — {patientName}</b>
            )}
          </span>
          {/* Поле остаётся видимым даже когда карта найдена: врач должен
              видеть, КУДА сохраняет, и иметь возможность изменить —
              например, если пациент заведён в клинике дважды. */}
          <input
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              setPatientName("");
            }}
            placeholder={patientName ? "" : "карта не выбрана"}
          />
        </label>

        {/* Карты нет — ищем или заводим прямо здесь.
            Раньше врач упирался в поле, куда нечего вписать, и весь
            записанный приём пропадал. Тупик посреди готовой работы —
            худшее, что может сделать инструмент. */}
        {!patientName && target === "private" && (
          <div className="sdm-find">
            <p className="sdm-find__hint">
              Карта этого пациента у вас не найдена. Заведите её в разделе
              «Мои пациенты» и вернитесь — черновик останется здесь, пока
              открыто окно.
            </p>
          </div>
        )}

        {!patientName && target !== "private" && (
          <div className="sdm-find">
            <p className="sdm-find__hint">
              Карта пациента не определилась. Найдите её по фамилии,
              телефону или почте — или заведите новую.
            </p>
            <div className="sdm-find__row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Фамилия, телефон или почта"
              />
              <button type="button" disabled={searching} onClick={runSearch}>
                {searching ? "Ищем…" : "Найти"}
              </button>
              <button
                type="button"
                className="ghost"
                disabled={creating}
                onClick={createCard}
              >
                {creating ? "Заводим…" : "Завести карту"}
              </button>
            </div>

            {found && found.length === 0 && (
              <p className="sdm-find__empty">
                В клинике таких пациентов нет — заведите карту.
              </p>
            )}

            {found && found.length > 0 && (
              <ul className="sdm-find__list">
                {found.map((p) => (
                  <li key={p.id || p._id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientId(p.id || p._id);
                        setPatientName(
                          `${p.lastName || ""} ${p.firstName || ""}`.trim(),
                        );
                        setFound(null);
                      }}
                    >
                      {p.lastName} {p.firstName}
                      {p.phone ? ` · ${p.phone}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {notice && <p className="sdm-notice">{notice}</p>}

        <div className="sdm-actions">
          <button type="button" disabled={busy} onClick={save}>
            {busy ? "Сохраняем…" : "Сохранить в карту"}
          </button>
          {/* Выход без сохранения обязателен: навязанный диалог кончается
              тем, что в карту попадает непроверенный текст. */}
          <button type="button" className="ghost" onClick={onClose}>
            Закрыть без сохранения
          </button>
        </div>
      </div>
    </div>
  );
}
