import { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, CheckCircle, Bell } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isPatientInClinic, setIsPatientInClinic] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await axios.get(`${API_BASE}/common-for-user`, {
          withCredentials: true,
        });
        console.log("✅ Аутентификация: ", response.data);

        if (response.data.authenticated) {
          setUserId(response.data.user.userId);
        } else {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("❌ Ошибка при проверке аутентификации:", error);
        setIsOpen(true);
      }
    };
    checkAuthentication();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/patient-profile/notification-for-confirmation`,
        { withCredentials: true }
      );
      console.log("📩 Уведомления с сервера:", response.data);

      // Проверяем, действительно ли пришел массив
      if (Array.isArray(response.data) && response.data.length > 0) {
        setNotifications(response.data);
      } else {
        setNotifications([]); // Очищаем, если данных нет
      }
    } catch (error) {
      console.error("❌ Ошибка при загрузке уведомлений:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.post(
        `${API_BASE}/patient-profile/notification-for-confirmation/mark-as-read/${id}`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (error) {
      console.error("❌ Ошибка при удалении уведомления:", error);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Bell className="w-6 h-6 text-blue-500" /> Уведомления
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
        </div>
      ) : (
        <>
          {notifications.length === 0 ? (
            <p className="text-gray-500 mt-4">Уведомлений нет.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {notifications.map((notif) => (
                <li
                  key={notif._id}
                  className="flex justify-between items-center p-3 border rounded-lg shadow-sm"
                >
                  <div>
                    <p className="text-gray-700">{notif.message}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="text-green-600 border border-green-600 hover:bg-green-100 p-2 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 mr-1 inline" /> Прочитано
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;
