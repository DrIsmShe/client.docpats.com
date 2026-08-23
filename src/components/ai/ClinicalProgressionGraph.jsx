// ClinicalProgressionGraph.jsx — исправленная версия
import React from "react";
import { useTranslation } from "react-i18next";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ClinicalProgressionGraph({ summary }) {
  const { t } = useTranslation("common");
  const data =
    summary?.clinicalProgression ||
    summary?.progressionGraph ||
    summary?.progressionTimeline ||
    null;

  // Нет реальных данных от AI — не показываем график вообще
  if (!Array.isArray(data) || !data.length) return null;

  const normalized = data.map((item, idx) => ({
    label: item.label || item.date || `Point ${idx + 1}`,
    score: Number(item.score ?? item.value ?? item.severity ?? 0),
  }));

  return (
    <div className="card shadow-sm border rounded-4 p-3 mb-3">
      <h5 className="mb-3">{t("dp.ai.progressionGraph")}</h5>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={normalized}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="score"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
