// client/src/pages/clinic/ClinicPatientDetailPage/PrintCardButton.jsx
//
// Печать медицинской карты одним листом.
//
// Отдельно от выгрузки в FHIR, и это не дублирование: FHIR — машинный
// формат, его читает другая система, а человек видит код. Здесь же лист,
// который кладут в историю, отдают пациенту на руки или берут на
// консультацию.
//
// Открываем во вкладке, а не сохраняем файлом: карту чаще смотрят на
// экране и печатают из просмотрщика, чем уносят на диск. Blob, а не прямая
// ссылка — чтобы запрос ушёл с заголовками сессии и чтобы отказ по правам
// показался сообщением, а не страницей с JSON.

import { useState } from "react";
import axios from "../../../axios";

export default function PrintCardButton({ patient }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const patientId = patient?._id || patient?.id;

  async function openCard() {
    if (!patientId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await axios.get(
        `/api/v1/clinic/medical/patients/${patientId}/card.pdf`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" }),
      );
      const win = window.open(url, "_blank", "noopener");
      if (!win) {
        // Всплывающие окна закрыты — тогда сохраняем файлом, иначе нажатие
        // не даёт вообще ничего и выглядит как поломка.
        const a = document.createElement("a");
        a.href = url;
        a.download = `patient-card-${patientId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      // Ссылку не освобождаем сразу: вкладка ещё грузит документ, и
      // revoke в этот момент оставил бы её пустой.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(
        err?.response?.status === 403
          ? "Недостаточно прав для печати карты"
          : "Не удалось собрать карту",
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
        onClick={openCard}
        title="Выписка на одном листе: аллергии, хронические, что принимает сейчас, последние приёмы и отклонения в анализах"
      >
        {busy ? "Собираем карту…" : "Печать карты"}
      </button>
      {error && <span className="med-export__error">{error}</span>}
    </div>
  );
}
