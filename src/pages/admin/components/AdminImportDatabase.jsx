import { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminImportDatabase() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      alert("Выбери файл database.json");
      return;
    }

    const confirmed = window.confirm(
      "⚠️ Импорт добавит данные поверх существующих. Продолжить?",
    );
    if (!confirmed) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        `${API_BASE}/api/admin/import-all`,
        formData,
        { withCredentials: true },
      );
      setResult(res.data); // { imported: { users: 12, articles: 45, ... } }
    } catch (err) {
      console.error(err);
      alert("Ошибка импорта: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".json"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="btn btn-danger"
      >
        {loading ? "Импортируется…" : "📥 Импортировать ВСЮ базу"}
      </button>

      {result && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <strong>Импортировано:</strong>
          <ul>
            {Object.entries(result.imported).map(([col, count]) => (
              <li key={col}>
                {col}: <strong>{count}</strong> документов
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
