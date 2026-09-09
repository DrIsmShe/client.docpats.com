// client/src/lib/articleTotals.js
//
// Сколько на платформе статей — одним числом.
//
// ЧТО СЧИТАЕТСЯ. Три источника, которые для читателя давно стали одним
// разделом: научные статьи врачей, их же публикации («взгляд врача») и
// аналитика, собранная ИИ. Дашборды считали только первые два, и цифра
// «Всего статей» расходилась с тем, что человек видел в ленте.
//
// ПОЧЕМУ ОБЩИЙ МОДУЛЬ. Тот же счёт нужен в кабинете врача и в кабинете
// пациента. Две копии одной арифметики разъезжаются на первой же правке —
// и разъезжались: у врача складывались два источника, у пациента один.
//
// ПОЧЕМУ ОШИБКА ИСТОЧНИКА НЕ ВАЛИТ СЧЁТ. Аналитика живёт в отдельной
// службе на другом сервере. Если она недоступна, лучше показать сумму
// двух оставшихся, чем ноль: дашборд не отчётность, а ориентир.

import axios from "axios";
import { fetchSynthesisArticles } from "../axios";

const API_BASE = process.env.REACT_APP_API_URL || "";

/** Число из ответа-счётчика; недоступный источник считаем нулём. */
async function счётчик(путь) {
  try {
    const { data } = await axios.get(`${API_BASE}${путь}`);
    return data?.count || 0;
  } catch {
    return 0;
  }
}

/**
 * Аналитика ИИ: всего и сколько вышло сегодня.
 *
 * Отдельного счётчика «за сегодня» у службы нет, и заводить его ради
 * одной цифры на дашборде незачем: статьи приходят по одной в сутки и
 * лежат первыми в списке — достаточно посмотреть первую страницу.
 */
async function аналитика() {
  try {
    const д = await fetchSynthesisArticles({ page: 1, limit: 20 });
    const сегодня = new Date().toDateString();
    const заСегодня = (д?.articles || []).filter(
      (а) => new Date(а.createdAt || а.publishedAt || 0).toDateString() === сегодня,
    ).length;
    return { total: д?.total || 0, today: заСегодня };
  } catch {
    return { total: 0, today: 0 };
  }
}

/**
 * Сводка по всем статьям платформы.
 *
 * @returns {Promise<{total: number, today: number}>}
 */
export async function сводкаСтатей() {
  const [публикацииВсего, научныеВсего, публикацииСегодня, научныеСегодня, ии] =
    await Promise.all([
      счётчик("/doctor-profile/api/count-all-articles"),
      счётчик("/doctor-profile/api/count-scientific-all-articles"),
      счётчик("/doctor-profile/api/count-articles-today"),
      счётчик("/doctor-profile/api/count-scientific-articles-today"),
      аналитика(),
    ]);

  return {
    total: публикацииВсего + научныеВсего + ии.total,
    today: публикацииСегодня + научныеСегодня + ии.today,
  };
}

export default { сводкаСтатей };
