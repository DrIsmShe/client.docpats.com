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
import ChartDataLabels from "chartjs-plugin-datalabels";

// Регистрируем всё
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

/**
 * График динамики пациентов по странам и времени (с подписями)
 */
const PatientsChartCountry = () => {
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
        `${API_BASE}/admin/polyclinic-static/patients-chart-country/${period}`,
        {
          withCredentials: true,
        }
      );

      console.log("🌍 Ответ API (страны):", res.data);

      if (res.data.success && Array.isArray(res.data.data)) {
        setChartRaw(res.data.data);
      } else {
        setChartRaw([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки графика по странам:", err);
      setError("Ошибка загрузки данных с сервера");
      setChartRaw([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData(chartPeriod);
  }, [chartPeriod]);

  /** Подготовка данных для Chart.js */
  const chartData = useMemo(() => {
    if (!chartRaw.length) return null;

    // Все уникальные периоды
    const allPeriods = [
      ...new Set(
        chartRaw.flatMap((item) => item.timeline.map((t) => t.period))
      ),
    ].sort();

    // Дatasets для каждой страны
    const datasets = chartRaw.map((countryItem, index) => ({
      label: countryItem.country || "Не указано",
      data: allPeriods.map((period) => {
        const found = countryItem.timeline.find((t) => t.period === period);
        return found ? found.count : 0;
      }),
      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 55%)`,
      borderColor: `hsl(${(index * 60) % 360}, 80%, 40%)`,
      borderWidth: 1,
      borderRadius: 6,
    }));

    return {
      labels: allPeriods,
      datasets,
    };
  }, [chartRaw]);

  /** Опции графика */
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    scales: {
      x: {
        title: {
          display: true,
          text:
            chartPeriod === "day"
              ? "Дни"
              : chartPeriod === "week"
              ? "Недели"
              : chartPeriod === "month"
              ? "Месяцы"
              : "Годы",
          color: "#333",
          font: { size: 14, weight: "bold" },
        },
        ticks: {
          color: "#444",
          autoSkip: true,
          maxRotation: 60,
          font: { size: 12 },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Количество пациентов", color: "#333" },
        ticks: { color: "#444" },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#333",
          font: { size: 13 },
          usePointStyle: true,
          pointStyle: "rectRounded",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        callbacks: {
          title: (items) => `Период: ${items[0].label}`,
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${ctx.formattedValue} пациентов`,
        },
      },
      title: {
        display: true,
        text: `Пациенты по странам (${chartPeriod})`,
        font: { size: 18, weight: "bold" },
      },

      // 🟡 Плагин отображения данных
      datalabels: {
        color: "#111",
        anchor: "end",
        align: "top",
        clamp: true,
        font: {
          weight: "bold",
          size: 11,
        },
        formatter: function (value, context) {
          if (value === 0) return "";
          return `${context.dataset.label}\n${value}`;
        },
      },
    },
  };

  return (
    <Card className="shadow border-0 mb-5">
      <Card.Body style={{ height: "520px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold text-secondary mb-0 flex-grow-1 text-center">
            Пациенты по странам и времени
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
          <Bar data={chartData} options={chartOptions} />
        )}
      </Card.Body>
    </Card>
  );
};

export default PatientsChartCountry;
