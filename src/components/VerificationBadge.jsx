import React from "react";

export default function VerificationBadge({ verification }) {
  if (!verification) return null;

  const { status, level } = verification;

  const map = {
    approved: "🟢 Verified",
    pending: "🟡 Pending Review",
    rejected: "🔴 Rejected",
    clarification_required: "🟠 Clarification Required",
    suspended: "⛔ Suspended",
    expired: "⚠ Expired",
    unverified: "⚪ Not Verified",
  };

  return (
    <div className="verification-badge">
      {map[status] || status} {level && `(${level})`}
    </div>
  );
}
