// client/src/pages/admin/doctor/AdminDoctorsManagePage.jsx
//
// Профили врачей: список, создание, правка, удаление.
//
// Не путать с pages/admin/entities/AdminDoctorsPage.jsx — та про ОБЗОР:
// сводка приёмов и рассылка уведомлений, заводить врачей она не умеет.
// Здесь наоборот: только управление профилями.
//
// ЗАЧЕМ. Врач заполняет профиль сам, но клиника нередко приводит сразу
// нескольких специалистов, и данные приходят на бумаге. Раньше в таких случаях
// профиль заводили прямо в базе.
//
// Форма повторяет ВСЕ поля, которые видит пациент на карточке врача: имя,
// специальность, клиника, адрес, образование с годами, ординатура, описание.
// Незаполненные поля на карточке просто не выводятся, поэтому важнее не
// количество полей, а то, чтобы заполненные выглядели как у практикующего
// специалиста.

import { useCallback, useEffect, useState } from "react";

import {
  fetchDoctors,
  fetchSpecializations,
  fetchDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  uploadDoctorPhoto,
  EMPTY_DOCTOR,
} from "../../../api/adminDoctors";
import { COUNTRIES } from "../../../constants/countries";
import "./adminDoctors.css";

export default function AdminDoctorsManagePage() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // null — форма закрыта, объект — открыта. userId внутри отличает правку от
  // создания: отдельного флага не нужно, и рассинхронизировать нечего.
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDoctors(await fetchDoctors({ q: search }));
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось загрузить список");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchSpecializations().then(setSpecializations).catch(() => {});
  }, []);

  const openCreate = () => {
    setNotice("");
    setForm({ ...EMPTY_DOCTOR });
  };

  const openEdit = async (userId) => {
    setNotice("");
    try {
      const doctor = await fetchDoctor(userId);
      // Годы приходят числами, а поля ввода работают со строками: без этого
      // пустой год превратится в «null» прямо в поле.
      setForm({
        ...EMPTY_DOCTOR,
        ...doctor,
        educationStartYear: doctor.educationStartYear || "",
        educationEndYear: doctor.educationEndYear || "",
        specializationStartYear: doctor.specializationStartYear || "",
        specializationEndYear: doctor.specializationEndYear || "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось открыть профиль");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = form.userId
        ? await updateDoctor(form.userId, form)
        : await createDoctor(form);

      setNotice(
        form.userId
          ? "Профиль сохранён"
          : `Врач заведён. Карточка: ${result.publicUrl}`,
      );
      setForm(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (doctor) => {
    const name = `${doctor.firstName} ${doctor.lastName}`.trim();
    // Спрашиваем прямо: карточка пропадёт из каталога, и пациенты её не найдут.
    if (!window.confirm(`Убрать врача ${name} из каталога?`)) return;

    try {
      await deleteDoctor(doctor.userId);
      setNotice("Врач убран из каталога");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Не удалось удалить");
    }
  };

  const set = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Для значений, которые приходят не из поля ввода: ссылка на загруженное фото.
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="adoc">
      <header className="adoc-head">
        <div>
          <h1>Врачи</h1>
          <p className="adoc-sub">
            Профили специалистов, которые видят пациенты в каталоге
          </p>
        </div>
        <button className="adoc-primary" onClick={openCreate}>
          Добавить врача
        </button>
      </header>

      {notice && <div className="adoc-notice">{notice}</div>}
      {error && <div className="adoc-error">{error}</div>}

      {form && (
        <DoctorForm
          form={form}
          set={set}
          setField={setField}
          specializations={specializations}
          saving={saving}
          onSubmit={save}
          onCancel={() => setForm(null)}
        />
      )}

      <div className="adoc-search">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Имя, фамилия или почта…"
        />
        {/* Поиск по зашифрованным полям идёт по хешу, поэтому находит только
            точное совпадение целиком — «Пет» не найдёт «Петрову». */}
        <span className="adoc-hint">точное совпадение</span>
      </div>

      {loading ? (
        <p className="adoc-empty">Загружаем…</p>
      ) : doctors.length === 0 ? (
        <p className="adoc-empty">Врачей не найдено</p>
      ) : (
        <table className="adoc-table">
          <thead>
            <tr>
              <th>Врач</th>
              <th>Специальность</th>
              <th>Клиника</th>
              <th>Почта</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.userId}>
                <td>
                  <b>
                    {d.firstName} {d.lastName}
                  </b>
                  {d.job && <div className="adoc-job">{d.job}</div>}
                  {d.isBlocked && <span className="adoc-blocked">заблокирован</span>}
                </td>
                <td>{d.specialization || "—"}</td>
                <td>{d.clinic || "—"}</td>
                <td className="adoc-email">{d.email}</td>
                <td className="adoc-actions">
                  {d.publicUrl && (
                    <a href={d.publicUrl} target="_blank" rel="noreferrer">
                      карточка
                    </a>
                  )}
                  <button onClick={() => openEdit(d.userId)}>править</button>
                  <button className="adoc-danger" onClick={() => remove(d)}>
                    убрать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DoctorForm({
  form,
  set,
  setField,
  specializations,
  saving,
  onSubmit,
  onCancel,
}) {
  // Специальности сгруппированы по разделам справочника — иначе в списке из
  // ста позиций нужную приходится искать глазами.
  const byCategory = specializations.reduce((acc, s) => {
    (acc[s.category || "Прочее"] ||= []).push(s);
    return acc;
  }, {});

  return (
    <form className="adoc-form" onSubmit={onSubmit}>
      <h2>{form.userId ? "Правка профиля" : "Новый врач"}</h2>

      <fieldset>
        <legend>Кто это</legend>
        <div className="adoc-grid">
          <Field label="Имя" required value={form.firstName} onChange={set("firstName")} />
          <Field label="Фамилия" required value={form.lastName} onChange={set("lastName")} />
          <Field
            label="Почта"
            required
            type="email"
            value={form.email}
            onChange={set("email")}
            hint="по ней врач войдёт в систему"
          />
          <Field label="Телефон" value={form.phone} onChange={set("phone")} />

          <label className="adoc-field">
            <span>Специальность</span>
            <select value={form.specializationId} onChange={set("specializationId")}>
              <option value="">— не выбрана —</option>
              {Object.entries(byCategory).map(([category, list]) => (
                <optgroup key={category} label={category}>
                  {list.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <Field
            label="Должность"
            value={form.job}
            onChange={set("job")}
            hint="как подписать под именем: «Невролог, эпилептолог»"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Где принимает</legend>
        <div className="adoc-grid">
          <Field label="Клиника" value={form.clinic} onChange={set("clinic")} />

          <label className="adoc-field">
            <span>Страна</span>
            <select value={form.country} onChange={set("country")}>
              <option value="">— не выбрана —</option>
              {/* Значение врача может не совпасть со справочником: профиль
                  заполнялся раньше, вручную. Показываем его отдельной
                  строкой, иначе при первой же правке страна молча слетит. */}
              {form.country && !COUNTRIES.includes(form.country) && (
                <option value={form.country}>{form.country}</option>
              )}
              {COUNTRIES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Адрес" value={form.address} onChange={set("address")} wide />
          <PhotoField
            value={form.profileImage}
            onChange={set("profileImage")}
            onUploaded={(url) => setField("profileImage", url)}
          />
          <label className="adoc-check">
            <input type="checkbox" checked={form.allowVideo} onChange={set("allowVideo")} />
            Ведёт видеоконсультации
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Образование</legend>
        <div className="adoc-grid">
          <Field
            label="Учебное заведение"
            value={form.educationInstitution}
            onChange={set("educationInstitution")}
            wide
          />
          <Field label="Год начала" type="number" value={form.educationStartYear} onChange={set("educationStartYear")} />
          <Field label="Год окончания" type="number" value={form.educationEndYear} onChange={set("educationEndYear")} />

          <Field
            label="Ординатура, специализация"
            value={form.specializationInstitution}
            onChange={set("specializationInstitution")}
            wide
          />
          <Field label="Год начала" type="number" value={form.specializationStartYear} onChange={set("specializationStartYear")} />
          <Field label="Год окончания" type="number" value={form.specializationEndYear} onChange={set("specializationEndYear")} />
        </div>
      </fieldset>

      <fieldset>
        <legend>О враче</legend>
        <label className="adoc-field adoc-field--wide">
          <span>Описание</span>
          <textarea
            rows={12}
            value={form.about}
            onChange={set("about")}
            placeholder={
              "Направления работы, подготовка, стаж, научная работа, языки.\n\nЭто главный текст карточки — его читает пациент, выбирая врача."
            }
          />
        </label>

        <label className="adoc-field">
          <span>Статус проверки</span>
          <select value={form.verificationStatus} onChange={set("verificationStatus")}>
            <option value="pending">не проверен</option>
            <option value="approved">документы проверены</option>
            <option value="rejected">отклонён</option>
          </select>
        </label>
      </fieldset>

      <div className="adoc-form-actions">
        <button type="submit" className="adoc-primary" disabled={saving}>
          {saving ? "Сохраняем…" : form.userId ? "Сохранить" : "Завести врача"}
        </button>
        <button type="button" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  );
}

/**
 * Фотография: ссылка или файл с компьютера.
 *
 * Поле со ссылкой оставлено намеренно — фото врача часто уже лежит на сайте
 * клиники, и вставить адрес быстрее, чем скачивать и заливать заново. Загрузка
 * нужна для второго случая: снимок прислали на почту, и в интернете его нет.
 *
 * Оба пути кончаются одним и тем же: в profileImage лежит ссылка. Поэтому
 * загрузка просто подставляет полученный адрес в то же поле — его видно, его
 * можно поправить руками, и сохранять профиль всё равно нужно кнопкой.
 */
function PhotoField({ value, onChange, onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    // Сбрасываем сразу: иначе повторный выбор того же файла не вызовет change.
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setErr("");
    try {
      onUploaded(await uploadDoctorPhoto(file));
    } catch (error) {
      setErr(error.response?.data?.message || "Не удалось загрузить файл");
    } finally {
      setBusy(false);
    }
  };

  // Обёртка — div, а не label: внутри два поля ввода, а label с несколькими
  // контролами переадресует щелчок первому из них, и кнопка выбора файла
  // открывала бы вместо диалога курсор в поле со ссылкой.
  return (
    <div className="adoc-field adoc-field--wide">
      <span>Фотография</span>
      <div className="adoc-photo">
        {value ? (
          <img className="adoc-photo-preview" src={value} alt="" />
        ) : (
          <div className="adoc-photo-preview adoc-photo-empty">нет фото</div>
        )}
        <div className="adoc-photo-body">
          <input
            value={value}
            onChange={onChange}
            placeholder="https://…"
            disabled={busy}
          />
          <div className="adoc-photo-actions">
            {/* input[type=file] спрятан: его стандартный вид не подчиняется
                оформлению формы, а щелчок по подписи работает так же. */}
            <span className="adoc-photo-btn">
              {busy ? "Загрузка…" : "Загрузить с компьютера"}
              <input type="file" accept="image/*" onChange={pick} disabled={busy} />
            </span>
            {value && !busy && (
              <button
                type="button"
                className="adoc-photo-clear"
                onClick={() => onUploaded("")}
              >
                убрать
              </button>
            )}
          </div>
          <em className="adoc-hint">
            {err || "ссылка на изображение или файл до 15 МБ"}
          </em>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, wide, ...props }) {
  return (
    <label className={`adoc-field${wide ? " adoc-field--wide" : ""}`}>
      <span>
        {label}
        {props.required && <b className="adoc-req"> *</b>}
      </span>
      <input {...props} />
      {hint && <em className="adoc-hint">{hint}</em>}
    </label>
  );
}
