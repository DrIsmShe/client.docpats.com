import React from "react";

import { useTranslation } from "react-i18next";
export default function EmptyChat() {
  const { t } = useTranslation("Communication");
  return (
    <div className="empty-chat">
      <div className="empty-chat-card">
        <div className="empty-chat-icon">🩺</div>

        <h2>{t("empty.title")}</h2>

        <p>
          {t("empty.line1")}
          <br />
          {t("empty.line2")}
        </p>
      </div>
    </div>
  );
}
