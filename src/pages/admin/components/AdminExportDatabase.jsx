import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL;

const AdminExportDatabase = () => {
  const handleDownload = async () => {
    console.log("📦 DOWNLOAD CLICK");
    try {
      const res = await axios.get(`${API_BASE}/api/admin/export-all`, {
        responseType: "blob",
        withCredentials: true,
      });

      const blob = new Blob([res.data], {
        type: "application/json",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "database.json";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Ошибка скачивания базы");
    }
  };

  return (
    <button onClick={handleDownload} className="btn btn-danger">
      📦 Скачать ВСЮ базу
    </button>
  );
};
export default AdminExportDatabase;
