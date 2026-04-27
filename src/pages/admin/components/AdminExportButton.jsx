import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminExportButton({ collection }) {
  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/export/${collection}`,
        {
          responseType: "blob",
          withCredentials: true,
        },
      );

      const blob = new Blob([response.data], {
        type: "application/json",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${collection}.json`;
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Ошибка скачивания");
    }
  };

  return (
    <button onClick={handleDownload} className="btn btn-outline-primary">
      📥 Скачать {collection}
    </button>
  );
}
