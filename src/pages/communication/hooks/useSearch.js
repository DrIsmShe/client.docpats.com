// client/src/communication/hooks/useSearch.js

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:11000";

/**
 * Хук поиска по диалогам и сообщениям.
 * @param {number} debounceMs — задержка дебаунса (по умолчанию 300ms)
 */
export function useSearch(debounceMs = 300) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ dialogs: [], messages: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const search = useCallback(async (q) => {
    // Отменяем предыдущий запрос
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    if (!q || q.trim().length < 2) {
      setResults({ dialogs: [], messages: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(
        `${API_URL}/communication/dialogs/search`,
        {
          params: { q: q.trim() },
          withCredentials: true,
          signal: abortRef.current.signal,
        },
      );
      setResults({
        dialogs: data.dialogs || [],
        messages: data.messages || [],
      });
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setError(err.message || "Search failed");
        setResults({ dialogs: [], messages: [] });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Дебаунс при изменении query
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), debounceMs);
    return () => clearTimeout(debounceRef.current);
  }, [query, search, debounceMs]);

  const clear = useCallback(() => {
    setQuery("");
    setResults({ dialogs: [], messages: [] });
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, clear };
}
