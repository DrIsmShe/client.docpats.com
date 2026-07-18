// client/src/utils/notificationIcon.js
//
// Единая иконка по типу уведомления — используется и в колокольчике, и на
// полной странице уведомлений, чтобы весь inbox выглядел одинаково.

const ICONS = {
  appointment_booked: "📅",
  appointment_confirmed: "📅",
  appointment_completed: "✅",
  appointment_cancelled: "❌",
  appointment_reminder: "⏰",
  comment: "💬",
  comment_reply: "💬",
  comment_doctor: "💬",
  comment_reply_in_article: "💬",
  "doctorProfile.commented": "💬",
  "doctorProfile.replied": "💬",
  "doctorProfile.commentSent": "💬",
  chat_message: "✉️",
  like: "👍",
  friend_request: "🤝",
  payment: "💳",
  consent_request_new: "🔐",
  clinic_lead: "📥",
  review_request: "⭐",
  system_message: "🔔",
  custom: "🔔",
};

export function notificationIcon(n) {
  const link = n?.link || "";
  if (/review=1/.test(link)) return "⭐"; // запрос отзыва (по ссылке)
  if (/\/registration\?ref=/.test(link)) return "🎁"; // реферал
  return ICONS[n?.type] || "🔔";
}

export default notificationIcon;
