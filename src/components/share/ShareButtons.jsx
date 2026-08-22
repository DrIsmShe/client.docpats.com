// components/share/ShareButtons.jsx
//
// Кнопки «поделиться» под материалом.
//
// Зачем отдельный компонент, а не разметка внутри страницы новости: тот
// же блок нужен статьям врачей и научным статьям, а три копии разъедутся
// при первой правке списка сетей.
//
// Почему это вообще имеет смысл только сейчас. До правки edge-функции
// ссылка, вставленная в мессенджер, разворачивалась в общую заглушку
// сайта — один заголовок и одна картинка на все материалы. Делиться
// таким бесполезно: получатель не понимает, что ему прислали. Теперь
// OG-теги подставляются по конкретному материалу, и у кнопок появился
// смысл.
//
// Ссылка берётся из props, а не из window.location: у новостей адрес
// зависит от языка (?locale=xx), и делиться надо ровно той версией,
// которую человек читает, — иначе коллега получит английский текст
// вместо азербайджанского.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/* ── Иконки. Инлайновые SVG, а не шрифт и не картинки: внешние запросы
      здесь лишние, а иконочный шрифт ради шести значков — тем более. ── */

const Icon = ({ children, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const TelegramIcon = () => (
  <Icon>
    <path d="M21.9 4.3 18.8 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-4.9L18 5.9c.4-.4-.1-.6-.6-.2L7.3 12.2l-4.8-1.5c-1-.3-1-1 .2-1.5l18-6.9c.9-.3 1.6.2 1.2 2z" />
  </Icon>
);

const WhatsAppIcon = () => (
  <Icon>
    <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5-4.5-.2-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.4.3.2.4.1.6 0l.9-1c.2-.2.4-.2.6-.1l2 1c.2.1.4.2.4.3.1.2.1.7 0 1z" />
  </Icon>
);

const LinkedInIcon = () => (
  <Icon>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95C20.6 8.75 21 11.3 21 14.4V21h-4v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H9z" />
  </Icon>
);

const XIcon = () => (
  <Icon>
    <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1-5.7 6.1H1.6l7.5-8.5L1.2 3h6.6l4.5 5.6zm-1.1 16.1h1.8L7.7 4.8H5.8z" />
  </Icon>
);

const MailIcon = () => (
  <Icon>
    <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4.2-8 5-8-5V6l8 5 8-5z" />
  </Icon>
);

const LinkIcon = () => (
  <Icon>
    <path d="M10.6 13.4a1 1 0 0 1 0-1.4l1.4-1.4a1 1 0 0 1 1.4 1.4l-1.4 1.4a1 1 0 0 1-1.4 0zM8 16a4 4 0 0 1 0-5.7l2.1-2.1 1.4 1.4L9.4 11.7a2 2 0 0 0 2.8 2.8l2.1-2.1 1.4 1.4-2.1 2.1A4 4 0 0 1 8 16zm8-8a4 4 0 0 1 0 5.7l-2.1 2.1-1.4-1.4 2.1-2.1a2 2 0 0 0-2.8-2.8L9.7 11.6 8.3 10.2l2.1-2.1A4 4 0 0 1 16 8z" />
  </Icon>
);

const CheckIcon = () => (
  <Icon>
    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
  </Icon>
);

const ShareIcon = () => (
  <Icon>
    <path d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.2c.5.5 1.2.8 2 .8a3 3 0 1 0-3-3c0 .2 0 .5.1.7L8 9.9a3 3 0 1 0 0 4.2l7.1 4.2c-.1.2-.1.4-.1.6a2.9 2.9 0 1 0 3-2.8z" />
  </Icon>
);

/** Скопировать текст. Возвращает true при успехе. */
async function copyText(text) {
  // navigator.clipboard есть не везде: он требует защищённого контекста,
  // а в iOS-вебвью и старых браузерах его нет вовсе. Молча ничего не
  // делать в таком случае хуже, чем воспользоваться устаревшим способом.
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* провалимся в запасной путь */
  }

  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export default function ShareButtons({ url, title = "", accent = "#1a5276" }) {
  const { t } = useTranslation("Share");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Проверяем в эффекте, а не при рендере: при серверном рендере или в
  // тестовой среде navigator может отсутствовать.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  if (!url) return null;

  const u = encodeURIComponent(url);
  const ttl = encodeURIComponent(title);

  const networks = [
    {
      key: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${u}&text=${ttl}`,
      icon: <TelegramIcon />,
      color: "#229ED9",
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${ttl}%20${u}`,
      icon: <WhatsAppIcon />,
      color: "#25D366",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      icon: <LinkedInIcon />,
      color: "#0A66C2",
    },
    {
      key: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${u}&text=${ttl}`,
      icon: <XIcon />,
      color: "#111827",
    },
    {
      // Врачи пересылают коллегам почтой чаще, чем кажется, — и это
      // единственный канал, который работает без единого аккаунта.
      key: "email",
      label: t("email", "Почта"),
      href: `mailto:?subject=${ttl}&body=${ttl}%0A%0A${u}`,
      icon: <MailIcon />,
      color: "#6b7280",
      sameTab: true,
    },
  ];

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      /* пользователь закрыл системное меню — это не ошибка */
    }
  };

  return (
    <div className="dp-share" aria-label={t("aria.region", "Поделиться материалом")}>
      <style>{CSS}</style>

      <div className="dp-share-head">
        <span className="dp-share-rule" style={{ background: accent }} />
        <p className="dp-share-title">{t("callToAction", "Поделитесь с коллегой")}</p>
        <p className="dp-share-note">
          {t("note", "Материал открыт и бесплатен — ссылку можно отправлять кому угодно.")}
        </p>
      </div>

      <div className="dp-share-row">
        {canNativeShare && (
          <button
            type="button"
            className="dp-share-btn dp-share-native"
            style={{ background: accent }}
            onClick={nativeShare}
          >
            <ShareIcon />
            <span>{t("share", "Поделиться")}</span>
          </button>
        )}

        {networks.map((n) => (
          <a
            key={n.key}
            className="dp-share-btn"
            href={n.href}
            target={n.sameTab ? undefined : "_blank"}
            rel={n.sameTab ? undefined : "noopener noreferrer"}
            style={{ color: n.color, borderColor: `${n.color}33` }}
            aria-label={t("aria.shareVia", "Поделиться через {{network}}", {
              network: n.label,
            })}
          >
            {n.icon}
            <span>{n.label}</span>
          </a>
        ))}

        <button
          type="button"
          className={`dp-share-btn dp-share-copy${copied ? " is-copied" : ""}`}
          onClick={async () => setCopied(await copyText(url))}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
          <span>
            {copied ? t("copied", "Скопировано") : t("copy", "Копировать ссылку")}
          </span>
        </button>
      </div>
    </div>
  );
}

const CSS = `
.dp-share {
  margin: 32px 0 8px;
  padding: 20px 0 4px;
  border-top: 1px solid #e8e6e1;
  font-family: 'Inter', system-ui, sans-serif;
}
.dp-share-head { margin-bottom: 14px; }
.dp-share-rule {
  display: block; width: 38px; height: 3px;
  border-radius: 2px; margin-bottom: 10px;
}
.dp-share-title {
  margin: 0 0 4px; font-size: 15px; font-weight: 600; color: #111827;
}
.dp-share-note {
  margin: 0; font-size: 12.5px; line-height: 1.5; color: #6b7280;
}
.dp-share-row {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px;
}
.dp-share-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 13px; border-radius: 999px;
  border: 1px solid #e5e7eb; background: #fff;
  font-size: 13px; font-weight: 500; line-height: 1;
  color: #374151; text-decoration: none; cursor: pointer;
  transition: background .15s, border-color .15s, transform .1s;
}
.dp-share-btn:hover { background: #f9fafb; transform: translateY(-1px); }
.dp-share-btn:active { transform: none; }
.dp-share-btn:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.dp-share-native { color: #fff !important; border-color: transparent !important; }
.dp-share-native:hover { filter: brightness(1.06); background: inherit; }
.dp-share-copy.is-copied { color: #059669; border-color: #a7f3d0; background: #ecfdf5; }

/* RTL: строка кнопок переворачивается вместе со страницей, отдельных
   правил не нужно — flex наследует направление от dir на контейнере. */

@media (max-width: 520px) {
  .dp-share-btn { padding: 8px 11px; font-size: 12.5px; }
}
`;
