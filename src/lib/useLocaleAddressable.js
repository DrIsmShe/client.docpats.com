// client/src/lib/useLocaleAddressable.js
//
// Публичная страница объявляет, что у неё есть языковые адреса.
//
// Нужно ровно одному потребителю — переключателю языка: на такой странице он
// дописывает ?locale= в адрес, чтобы скопированная ссылка открылась на том
// языке, на котором её отправили, а не на языке получателя. На страницах
// кабинета параметр не нужен и адрес не трогается.
//
// Объявление снимается при уходе со страницы, иначе оно «протекало» бы на
// следующий маршрут: SPA компоненты не перезагружает.

import { useEffect } from "react";
import { markLocaleAddressable } from "./language";

/**
 * @param {string|null} originalLanguage - язык оригинала материала. Переключение
 *   на него убирает параметр: оригинал живёт на голом адресе. Пока не
 *   загружен — null, объявление обновится, когда данные придут.
 * @param {boolean} [enabled=true] - объявлять ли вообще
 */
export function useLocaleAddressable(originalLanguage, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    return markLocaleAddressable({ original: originalLanguage });
  }, [originalLanguage, enabled]);
}

export default useLocaleAddressable;
