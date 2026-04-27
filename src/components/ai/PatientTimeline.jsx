// src/components/ai/PatientTimeline.jsx

import React from "react";
import dayjs from "dayjs";

const riskColors = {
  low: "#16a34a",
  moderate: "#eab308",
  high: "#dc2626",
};

const riskEmoji = {
  low: "🟢",
  moderate: "🟡",
  high: "🔴",
};

export default function PatientTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-4 mt-4">
        <h3 className="font-semibold mb-3">📅 Patient Timeline</h3>
        <div className="text-gray-500">Медицинские события не найдены</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 mt-4">
      <h3 className="font-semibold mb-4">📅 Patient Timeline</h3>

      <div className="timeline">
        {events.map((event, index) => {
          const risk = event.severity || "low";

          return (
            <div key={index} className="timeline-row">
              <div
                className="timeline-dot"
                style={{ background: riskColors[risk] }}
              />

              <div className="timeline-card">
                <div className="timeline-header">
                  <span className="timeline-type">{event.type}</span>

                  <span className="timeline-date">
                    {dayjs(event.date).format("DD MMM YYYY")}
                  </span>
                </div>

                <div className="timeline-title">{event.title}</div>

                <div className="timeline-meta">
                  {event.severity && (
                    <span
                      className="timeline-risk"
                      style={{ color: riskColors[event.severity] }}
                    >
                      {riskEmoji[event.severity]} {event.severity}
                    </span>
                  )}

                  {event.aiConfidence && (
                    <span className="timeline-ai">
                      🤖 AI {(event.aiConfidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .timeline {
          position: relative;
          margin-left: 20px;
        }

        .timeline::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e5e7eb;
        }

        .timeline-row {
          display: flex;
          margin-bottom: 20px;
          position: relative;
        }

        .timeline-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          position: absolute;
          left: -12px;
          top: 8px;
        }

        .timeline-card {
          background: #f9fafb;
          padding: 12px 14px;
          border-radius: 10px;
          width: 100%;
          border: 1px solid #e5e7eb;
        }

        .timeline-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .timeline-type {
          font-weight: 600;
        }

        .timeline-title {
          font-weight: 600;
          margin-top: 4px;
          margin-bottom: 6px;
        }

        .timeline-meta {
          display: flex;
          gap: 12px;
          font-size: 0.85rem;
        }

        .timeline-ai {
          color: #2563eb;
        }
      `}</style>
    </div>
  );
}
