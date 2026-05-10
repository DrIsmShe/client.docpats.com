// client/src/pages/clinic/ClinicDashboardPage/ClinicDashboardPage.jsx
//
// Stub for Day 2. Will be implemented properly in Day 3.

import React from "react";
import { useOutletContext, Link } from "react-router-dom";

export default function ClinicDashboardPage() {
  const context = useOutletContext();
  const clinic = context?.clinic;

  return (
    <div style={{ padding: "24px 0", textAlign: "center" }}>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, color: "#1a1f2e" }}>
        🎉 Clinic created!
      </h1>
      <p style={{ color: "#6b7280", fontSize: 16, marginBottom: 24 }}>
        {clinic?.name ? `Welcome to ${clinic.name}.` : "Your clinic is ready."}
      </p>

      {clinic && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e6eaf0",
            borderRadius: 12,
            padding: 24,
            maxWidth: 480,
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#1a1f2e" }}>
            Clinic details
          </h3>
          <dl
            style={{
              margin: 0,
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "8px 16px",
              fontSize: 14,
            }}
          >
            <dt style={{ color: "#6b7280" }}>Name:</dt>
            <dd style={{ margin: 0, color: "#1a1f2e" }}>{clinic.name}</dd>

            <dt style={{ color: "#6b7280" }}>Slug:</dt>
            <dd style={{ margin: 0, color: "#1a1f2e" }}>
              {clinic.slug || "—"}
            </dd>

            <dt style={{ color: "#6b7280" }}>Timezone:</dt>
            <dd style={{ margin: 0, color: "#1a1f2e" }}>
              {clinic.timezone || "—"}
            </dd>

            <dt style={{ color: "#6b7280" }}>Currency:</dt>
            <dd style={{ margin: 0, color: "#1a1f2e" }}>
              {clinic.defaultCurrency || "—"}
            </dd>

            <dt style={{ color: "#6b7280" }}>Tier:</dt>
            <dd style={{ margin: 0, color: "#1a1f2e" }}>
              {clinic.tier || "free"}
            </dd>
          </dl>
        </div>
      )}

      <p style={{ marginTop: 24, color: "#6b7280", fontSize: 13 }}>
        Full dashboard coming in Day 3 ·{" "}
        <Link to="/clinic" style={{ color: "#2563eb" }}>
          Back to hub
        </Link>
      </p>
    </div>
  );
}
