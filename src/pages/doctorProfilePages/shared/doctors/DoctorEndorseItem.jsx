import React from "react";
import { useTranslation } from "react-i18next";

export default function DoctorEndorseItem({ endorsement }) {
  const { t } = useTranslation();
  const e = endorsement;

  const from = e && typeof e.fromDoctorId === "object" ? e.fromDoctorId : null;

  const name = from
    ? `${from.firstName || ""} ${from.lastName || ""}`.trim() ||
      t("endorse.unknownDoctor")
    : t("endorse.unknownDoctor");

  const specialization =
    from?.specializationName || t("endorse.specializationNotSpecified");

  const avatar = from?.avatar || "/default-avatar-doctor.png";

  const dateStr = e.createdAt
    ? new Date(e.createdAt).toLocaleDateString(t("lang.locale"), {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

  return (
    <div
      className="card mb-2 shadow-sm"
      style={{ borderLeft: "4px solid #0d6efd" }}
    >
      <div className="card-body d-flex">
        <img
          src={avatar}
          alt={name}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            objectFit: "cover",
            marginRight: 12,
          }}
        />

        <div style={{ flex: 1 }}>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <strong>{name}</strong>
              <div
                className="text-muted"
                style={{ fontSize: "0.85rem", marginTop: 2 }}
              >
                {specialization}
              </div>
            </div>

            {dateStr && (
              <span
                className="badge bg-light text-muted"
                style={{ fontSize: "0.75rem" }}
              >
                {dateStr}
              </span>
            )}
          </div>

          <p className="mb-0 mt-2">
            {e.comment && e.comment.trim().length > 0 ? (
              e.comment
            ) : (
              <span className="text-muted">{t("endorse.noComment")}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
