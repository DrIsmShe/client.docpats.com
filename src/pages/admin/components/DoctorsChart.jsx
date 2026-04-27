import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, ButtonGroup, Button, Spinner, Alert } from "react-bootstrap";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DoctorsChart = () => {
  const [chartPeriod, setChartPeriod] = useState("month");
  const [chartRaw, setChartRaw] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  /** Загрузка данных */
  const fetchChartData = async (period) => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${API_BASE}/admin/polyclinic-static/doctors-chart/${period}`,
        {
          withCredentials: true,
        }
      );

      console.log("📊 Ответ API (врачи):", res.data);

      if (res.data.success && Array.isArray(res.data.data)) {
        setChartRaw(res.data.data);
      } else {
        setChartRaw([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки графика врачей:", err);
      setError("Ошибка загрузки данных с сервера");
      setChartRaw([]);
    } finally {
      setLoading(false);
    }
  };

  /** Первичная загрузка и при смене периода */
  useEffect(() => {
    fetchChartData(chartPeriod);
  }, [chartPeriod]);

  /** Подготовка данных для Chart.js */
  const chartData = useMemo(() => {
    if (!chartRaw.length) return null;

    const labels = chartRaw.map((item) => item.label);
    const values = chartRaw.map((item) => item.count);

    return {
      labels,
      datasets: [
        {
          label: "Количество врачей",
          data: values,
          backgroundColor: "rgba(255, 159, 64, 0.7)", // оранжевый цвет для различия
          borderRadius: 6,
          borderWidth: 1,
        },
      ],
    };
  }, [chartRaw]);

  return (
    <Card className="shadow border-0 mb-5">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold text-secondary mb-0 flex-grow-1 text-center">
            Активность регистрации врачей
          </h5>

          <ButtonGroup>
            {[
              ["day", "Дни"],
              ["week", "Недели"],
              ["month", "Месяцы"],
              ["year", "Годы"],
            ].map(([key, label]) => (
              <Button
                key={key}
                variant={chartPeriod === key ? "primary" : "outline-primary"}
                size="sm"
                onClick={() => setChartPeriod(key)}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="text-muted mt-2">Загрузка данных...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : !chartRaw.length ? (
          <p className="text-center text-muted py-4">
            Нет данных для отображения
          </p>
        ) : (
          <Bar
            data={chartData}
            options={{
              responsive: true,
              animation: {
                duration: 1000,
                easing: "easeOutQuart",
              },
              scales: {
                x: {
                  ticks: { color: "#444" },
                  grid: { display: false },
                },
                y: {
                  beginAtZero: true,
                  ticks: { color: "#444" },
                  grid: { color: "rgba(0,0,0,0.05)" },
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `Врачей: ${ctx.formattedValue}`,
                  },
                },
              },
            }}
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default DoctorsChart;
