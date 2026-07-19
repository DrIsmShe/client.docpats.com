// client/src/utils/webPush.js
//
// Помощник для браузерных web-push уведомлений: проверка поддержки,
// подписка/отписка через Service Worker + PushManager, синхронизация с
// бэкендом (/notifications/push/*).

const API_BASE = process.env.REACT_APP_API_URL;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported() {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Текущее состояние: поддержка, разрешение, подписан ли.
export async function getPushState() {
  if (!pushSupported()) return { supported: false };
  let subscribed = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    subscribed = !!sub;
  } catch {
    /* игнор */
  }
  return {
    supported: true,
    permission: Notification.permission,
    subscribed,
  };
}

// Включить пуш: спросить разрешение, подписаться, отправить на бэкенд.
export async function enablePush() {
  if (!pushSupported()) throw new Error("Пуш не поддерживается этим браузером");

  const keyRes = await fetch(`${API_BASE}/notifications/push/public-key`, {
    credentials: "include",
  });
  const keyData = await keyRes.json();
  if (!keyData?.enabled || !keyData?.publicKey) {
    throw new Error("Пуш временно недоступен на сервере");
  }

  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Вы не разрешили уведомления");

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
    });
  }

  const res = await fetch(`${API_BASE}/notifications/push/subscribe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub }),
  });
  if (!res.ok) throw new Error("Не удалось сохранить подписку");
  return true;
}

// Выключить пуш: отписаться и сообщить бэкенду.
export async function disablePush() {
  if (!pushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch(`${API_BASE}/notifications/push/unsubscribe`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
    await sub.unsubscribe().catch(() => {});
  } catch {
    /* игнор */
  }
}
