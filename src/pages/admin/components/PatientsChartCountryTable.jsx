import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  ButtonGroup,
  Button,
  Spinner,
  Alert,
  Table,
  Accordion,
} from "react-bootstrap";

/**
 * Таблица статистики пациентов по странам и времени
 */
const PatientsChartCountryTable = () => {
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
        `${API_BASE}/admin/polyclinic-static/patients-chart-country/${period}`,
        {
          withCredentials: true,
        }
      );

      console.log("📋 Ответ API (страны):", res.data);

      if (res.data.success && Array.isArray(res.data.data)) {
        setTableData(res.data.data);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Ошибка загрузки:", err);
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
            Таблица пациентов по странам
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
            <Spinner animation="border" variant="primary" />
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
            <Accordion alwaysOpen>
              {tableData.map((country, index) => (
                <Accordion.Item eventKey={index.toString()} key={index}>
                  <Accordion.Header>
                    🌍{" "}
                    <strong>
                      {country.country || "Не указано"} — {country.total}{" "}
                      пациентов
                    </strong>
                  </Accordion.Header>
                  <Accordion.Body className="p-0">
                    <Table
                      striped
                      bordered
                      hover
                      responsive
                      className="align-middle text-center mb-0"
                    >
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "60%" }}>Период</th>
                          <th style={{ width: "40%" }}>Количество пациентов</th>
                        </tr>
                      </thead>
                      <tbody>
                        {country.timeline
                          .sort((a, b) => a.period.localeCompare(b.period))
                          .map((periodItem, i) => (
                            <tr key={i}>
                              <td className="fw-semibold">
                                {periodItem.period}
                              </td>
                              <td>{periodItem.count}</td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>

            <p className="text-end text-muted small mt-3 mb-0">
              Всего стран: {tableData.length}
            </p>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default PatientsChartCountryTable;
