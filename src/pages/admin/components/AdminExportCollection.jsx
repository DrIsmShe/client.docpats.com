import { useEffect, useState } from "react";
import axios from "axios";
import AdminExportButton from "./AdminExportButton"; // 👈 БЕЗ {}

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminExportCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/admin/collections`, {
        withCredentials: true,
      })
      .then((res) => {
        setCollections(res.data.collections || []);
      })
      .catch((err) => {
        console.error("Ошибка загрузки коллекций", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Загрузка…</div>;

  return (
    <div className="d-grid gap-2">
      {collections.map((name) => (
        <AdminExportButton key={name} collection={name} />
      ))}
    </div>
  );
}
