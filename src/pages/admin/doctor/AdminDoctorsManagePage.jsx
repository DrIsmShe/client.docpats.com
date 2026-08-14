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
  EMPTY_DOCTOR,
} from "../../../api/adminDoctors";
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

function DoctorForm({ form, set, specializations, saving, onSubmit, onCancel }) {
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
          <Field label="Страна" value={form.country} onChange={set("country")} />
          <Field label="Адрес" value={form.address} onChange={set("address")} wide />
          <Field
            label="Фотография"
            value={form.profileImage}
            onChange={set("profileImage")}
            hint="ссылка на изображение"
            wide
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
