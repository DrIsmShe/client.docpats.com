// client/src/pages/clinic/ClinicPatientDetailPage/FhirExportButton.jsx
//
// Выгрузка карты пациента в FHIR R4.
//
// ЗАЧЕМ КНОПКА, А НЕ ССЫЛКА. Обычная <a href> отправила бы браузер по
// адресу без заголовков сессии в некоторых конфигурациях и, главное, не
// дала бы показать ошибку: при отказе по правам человек увидел бы
// JSON-текст вместо страницы. Здесь запрос идёт как все остальные, а
// файл собирается уже из ответа.
//
// НАЗВАНИЕ ФАЙЛА С ИМЕНЕМ ПАЦИЕНТА НЕ СТАВИМ. Файл уезжает на диск, в
// почту, в мессенджер — и его имя видно всем, кто увидит папку.
// «Иванова-карта.json» разглашает факт обращения ещё до открытия файла.

import { useState } from "react";
import axios from "../../../axios";

export default function FhirExportButton({ patient }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const patientId = patient?._id || patient?.id;

  async function download() {
    if (!patientId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await axios.get(
        `/api/v1/clinic/medical/patients/${patientId}/fhir`,
        { responseType: "blob" },
      );

      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/fhir+json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient-${patientId}-fhir.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Ссылку освобождаем: иначе blob висит в памяти вкладки до
      // перезагрузки, а карта может весить мегабайты.
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.status === 403
          ? "Недостаточно прав для выгрузки карты"
          : "Не удалось выгрузить карту",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="med-export">
      <button
        type="button"
        className="edu-btn edu-btn--ghost"
        disabled={busy}
        onClick={download}
        title="Машинный формат FHIR R4 для передачи карты в другую клинику, лабораторию или реестр. Файл открывается кодом — это не документ для чтения; для чтения и печати есть «Печать карты»."
      >
        {busy
          ? "Готовим выгрузку…"
          : "Выгрузить для другой системы (FHIR)"}
      </button>
      {error && <span className="med-export__error">{error}</span>}
    </div>
  );
}
