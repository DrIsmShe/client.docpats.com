// client/src/utils/notificationCategory.js
//
// Сводит множество «сырых» типов уведомлений к нескольким понятным
// категориям для фильтров в едином центре уведомлений.

export const NOTIFICATION_CATEGORIES = [
  { key: "all", icon: "🗂", label: "Все" },
  { key: "appointments", icon: "📅", label: "Приёмы" },
  { key: "chat", icon: "✉️", label: "Чат" },
  { key: "reviews", icon: "⭐", label: "Отзывы" },
  { key: "comments", icon: "💬", label: "Комментарии" },
  { key: "other", icon: "🔔", label: "Прочее" },
];

// Возвращает ключ категории для конкретного уведомления.
export function notificationCategory(n) {
  const type = n?.type || "";
  const link = n?.link || "";

  if (/review=1/.test(link) || type === "review_request") return "reviews";
  if (type.startsWith("appointment")) return "appointments";
  if (type === "chat_message") return "chat";
  if (type.startsWith("comment") || type.startsWith("doctorProfile"))
    return "comments";
  return "other";
}
