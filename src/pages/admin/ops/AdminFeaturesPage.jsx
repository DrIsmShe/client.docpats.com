// client/src/pages/admin/ops/AdminFeaturesPage.jsx
//
// п.4 Управление фичами клиник: выбор клиники → включить/выключить фичи.
// GET /admin/clinics, GET/PATCH /admin/clinics/:id/features.

import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminFeaturesPage() {
  const [clinics, setClinics] = useState([]);
  const [clinicId, setClinicId] = useState("");
  const [features, setFeatures] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/admin/clinics?limit=200`, { withCredentials: true })
      .then((r) => setClinics(r.data.clinics || []))
      .catch((e) =>
        setError(
          e.response?.status === 403
            ? "Доступ только для администратора."
            : "Не удалось загрузить клиники.",
        ),
      );
  }, []);

  useEffect(() => {
    if (!clinicId) {
      setFeatures([]);
      return;
    }
    axios
      .get(`${API_BASE}/admin/clinics/${clinicId}/features`, {
        withCredentials: true,
      })
      .then((r) => setFeatures(r.data.features || []))
      .catch(() => setError("Не удалось загрузить фичи."));
  }, [clinicId]);

  async function toggle(feature, enabled) {
    setBusy(feature);
    setError(null);
    try {
      await axios.patch(
        `${API_BASE}/admin/clinics/${clinicId}/features`,
        { feature, enabled },
        { withCredentials: true },
      );
      setFeatures((prev) =>
        prev.map((f) => (f.feature === feature ? { ...f, enabled } : f)),
      );
    } catch (e) {
      setError(e.response?.data?.message || "Не удалось изменить фичу.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Фичи клиник</h1>

      <select
        value={clinicId}
        onChange={(e) => setClinicId(e.target.value)}
        style={{ ...input, width: "100%", marginBottom: 20 }}
      >
        <option value="">— выберите клинику —</option>
        {clinics.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name} ({c.tier})
          </option>
        ))}
      </select>

      {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}

      {clinicId && features.length > 0 && (
        <div>
          {features.map((f) => (
            <label key={f.feature} style={featRow}>
              <span>{f.feature}</span>
              <input
                type="checkbox"
                checked={f.enabled}
                disabled={busy === f.feature}
                onChange={(e) => toggle(f.feature, e.target.checked)}
              />
            </label>
          ))}
          <p style={{ color: "#64748b", fontSize: 12, marginTop: 12 }}>
            Фичи включены тарифом или ручным переопределением. Снятие галочки
            отключит фичу для этой клиники независимо от тарифа.
          </p>
        </div>
      )}
      {clinicId && features.length === 0 && !error && (
        <div style={{ color: "#64748b" }}>Загрузка…</div>
      )}
    </div>
  );
}

const input = { padding: "8px 10px", border: "1px solid #d9dfe8", borderRadius: 8, fontSize: 14 };
const featRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 14px",
  background: "#fff",
  border: "1px solid #e6eaf0",
  borderRadius: 8,
  marginBottom: 8,
  fontSize: 14,
};
