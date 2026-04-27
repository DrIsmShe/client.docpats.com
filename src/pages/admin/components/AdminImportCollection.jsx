import { useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminImportCollection() {
  const [file, setFile] = useState(null);
  const [collection, setCollection] = useState("");

  const handleUpload = async () => {
    if (!file || !collection) {
      alert("Выбери файл и коллекцию");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API_BASE}/api/admin/import-collection?collectionName=${collection}`,
        formData,
        { withCredentials: true },
      );

      alert(`Импортировано: ${res.data.inserted}`);
    } catch (err) {
      console.error(err);
      alert("Ошибка импорта");
    }
  };

  return (
    <div>
      <input
        placeholder="Название коллекции (users, articles...)"
        value={collection}
        onChange={(e) => setCollection(e.target.value)}
      />

      <input
        type="file"
        accept=".json"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload} className="btn btn-warning">
        ⬆️ Загрузить коллекцию
      </button>
    </div>
  );
}
