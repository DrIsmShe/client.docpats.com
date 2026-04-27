import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  ButtonGroup,
  Button,
  Spinner,
  Alert,
  Table,
} from "react-bootstrap";

/**
 * Компонент таблицы статистики изменения количества врачей
 * по дням, неделям, месяцам и годам
 */
const DoctorsChartTable = () => {
  const [chartPeriod, setChartPeriod] = useState("month");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  /** Загрузка данных */
  const fetchTableData = async (period) => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        `${API_BASE}/admin/polyclinic-static/doctors-chart/${period}`,
        {
          withCredentials: true,
        }
      );

      console.log("📋 Ответ API (врачи):", res.data);

      if (res.data.success && Array.isArray(res.data.data)) {
        setTableData(res.data.data);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки таблицы врачей:", err);
      setError("Ошибка загрузки данных с сервера");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  /** Первичная загрузка и при смене периода */
  useEffect(() => {
    fetchTableData(chartPeriod);
  }, [chartPeriod]);

  return (
    <Card className="shadow border-0 mb-5">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold text-secondary mb-0 flex-grow-1 text-center">
            Статистика регистрации врачей
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

        {/* Состояния */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <p className="text-muted mt-2">Загрузка данных...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        ) : !tableData.length ? (
          <p className="text-center text-muted py-4">
            Нет данных для отображения
          </p>
        ) : (
          <>
            <Table
              striped
              bordered
              hover
              responsive
              className="align-middle text-center"
            >
              <thead className="table-warning">
                <tr>
                  <th style={{ width: "70%" }}>Период</th>
                  <th style={{ width: "30%" }}>Количество врачей</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr key={index}>
                    <td className="fw-semibold">{item.label}</td>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <p className="text-end text-muted small mb-0">
              Всего записей: {tableData.length}
            </p>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default DoctorsChartTable;
