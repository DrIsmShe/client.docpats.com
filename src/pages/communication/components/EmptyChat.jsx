import React from "react";

export default function EmptyChat() {
  return (
    <div className="empty-chat">
      <div className="empty-chat-card">
        <div className="empty-chat-icon">🩺</div>

        <h2>Select a dialog</h2>

        <p>
          To start a conversation, select a patient
          <br />
          or colleague from the list on the left
        </p>
      </div>
    </div>
  );
}
