// client/src/communication/hooks/useMessageTranslation.js

import { useState, useCallback, useRef, useEffect } from "react";
import { getSocket } from "../socket.js";

const API = process.env.REACT_APP_API_URL || "http://localhost:11000";

// ─── In-memory кэш: "messageId:lang" → translatedText ────────────────────────
// Живёт пока открыта страница, переживает ре-рендеры
const _cache = new Map();
function cKey(messageId, lang) {
  return `${messageId}:${lang}`;
}

// ─── HTTP fallback ────────────────────────────────────────────────────────────
async function httpTranslate(messageId, targetLang) {
  const res = await fetch(`${API}/communication/translations/${messageId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ targetLang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Хук ──────────────────────────────────────────────────────────────────────
export function useMessageTranslation(targetLang) {
  const [translations, setTranslations] = useState(() => new Map());
  const [loadingIds, setLoadingIds] = useState(() => new Set());
  const [errorIds, setErrorIds] = useState(() => new Map());
  // Какие сообщения сейчас показывают перевод (toggle)
  const [showSet, setShowSet] = useState(() => new Set());

  const pendingRef = useRef(new Set());
  // Храним текущий язык в ref чтобы колбэки не устаревали
  const targetLangRef = useRef(targetLang);

  // ── При смене языка — СБРОС всех переводов и состояний ───────────────────
  useEffect(() => {
    targetLangRef.current = targetLang;

    // Сбрасываем всё — переводы были на старом языке
    setTranslations(new Map());
    setShowSet(new Set());
    setLoadingIds(new Set());
    setErrorIds(new Map());
    // Очищаем pending — иначе повторный запрос заблокируется проверкой has()
    pendingRef.current = new Set();
  }, [targetLang]);

  // ── Подписка на socket-события (пересоздаётся при смене языка) ───────────
  useEffect(() => {
    const socket = getSocket();

    const onResult = ({ messageId, translatedText, sameLanguage }) => {
      const lang = targetLangRef.current;
      const text = sameLanguage ? null : translatedText;

      if (text) {
        _cache.set(cKey(messageId, lang), text);
        setTranslations((prev) => new Map(prev).set(messageId, text));
      }
      setLoadingIds((prev) => {
        const n = new Set(prev);
        n.delete(messageId);
        return n;
      });
      pendingRef.current.delete(messageId);
    };

    const onError = ({ messageId, error }) => {
      setErrorIds((prev) => new Map(prev).set(messageId, error || "Ошибка"));
      setLoadingIds((prev) => {
        const n = new Set(prev);
        n.delete(messageId);
        return n;
      });
      pendingRef.current.delete(messageId);
    };

    socket.on("translation:result", onResult);
    socket.on("translation:error", onError);
    return () => {
      socket.off("translation:result", onResult);
      socket.off("translation:error", onError);
    };
  }, [targetLang]);

  // ── Запросить перевод ─────────────────────────────────────────────────────
  const requestTranslation = useCallback((messageId, originalText) => {
    const lang = targetLangRef.current;
    if (!messageId || !originalText || !lang) return;
    if (pendingRef.current.has(messageId)) return;

    // In-memory кэш
    const cached = _cache.get(cKey(messageId, lang));
    if (cached) {
      setTranslations((prev) => new Map(prev).set(messageId, cached));
      return;
    }

    setErrorIds((prev) => {
      const n = new Map(prev);
      n.delete(messageId);
      return n;
    });
    setLoadingIds((prev) => new Set([...prev, messageId]));
    pendingRef.current.add(messageId);

    const socket = getSocket();

    if (socket.connected) {
      socket.emit("translation:request", { messageId, targetLang: lang });

      // Таймаут 10 сек → HTTP fallback
      setTimeout(async () => {
        if (!pendingRef.current.has(messageId)) return;
        pendingRef.current.delete(messageId);
        try {
          const result = await httpTranslate(messageId, lang);
          const text = result.sameLanguage ? null : result.translatedText;
          if (text) {
            _cache.set(cKey(messageId, lang), text);
            setTranslations((prev) => new Map(prev).set(messageId, text));
          }
        } catch (err) {
          setErrorIds((prev) => new Map(prev).set(messageId, err.message));
        } finally {
          setLoadingIds((prev) => {
            const n = new Set(prev);
            n.delete(messageId);
            return n;
          });
        }
      }, 10_000);
    } else {
      // HTTP path
      httpTranslate(messageId, lang)
        .then((result) => {
          const text = result.sameLanguage ? null : result.translatedText;
          if (text) {
            _cache.set(cKey(messageId, lang), text);
            setTranslations((prev) => new Map(prev).set(messageId, text));
          }
        })
        .catch((err) =>
          setErrorIds((prev) => new Map(prev).set(messageId, err.message)),
        )
        .finally(() => {
          pendingRef.current.delete(messageId);
          setLoadingIds((prev) => {
            const n = new Set(prev);
            n.delete(messageId);
            return n;
          });
        });
    }
  }, []); // зависимостей нет — читаем lang из ref

  // ── Toggle: показать/скрыть перевод ──────────────────────────────────────
  const toggleTranslation = useCallback(
    (messageId, originalText) => {
      setShowSet((prev) => {
        const next = new Set(prev);
        if (next.has(messageId)) {
          next.delete(messageId); // скрыть → показать оригинал
        } else {
          next.add(messageId); // показать → запросить если нет
          // Проверяем есть ли перевод для ТЕКУЩЕГО языка
          const lang = targetLangRef.current;
          const cached = _cache.get(cKey(messageId, lang));
          if (!cached) {
            requestTranslation(messageId, originalText);
          } else {
            // Уже в кэше — просто обновляем стейт
            setTranslations((prev) => new Map(prev).set(messageId, cached));
          }
        }
        return next;
      });
    },
    [requestTranslation],
  );

  // ── Геттеры ───────────────────────────────────────────────────────────────
  const isTranslated = useCallback(
    (messageId) => showSet.has(messageId),
    [showSet],
  );

  const getText = useCallback(
    (messageId, originalText) =>
      showSet.has(messageId) && translations.has(messageId)
        ? translations.get(messageId)
        : originalText,
    [showSet, translations],
  );

  return {
    translations,
    loadingIds,
    errorIds,
    toggleTranslation,
    isTranslated,
    getText,
  };
}

// ─── Утилиты ─────────────────────────────────────────────────────────────────
export async function savePreferredLanguage(lang) {
  const res = await fetch(`${API}/communication/translations/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ lang }),
  });
  return res.ok;
}

export async function getSupportedLanguages() {
  const res = await fetch(`${API}/communication/translations/languages`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.languages || [];
}
