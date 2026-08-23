// client/src/utils/categoryName.js
//
// Название рубрики статьи.
//
// В базе category — ObjectId со ссылкой на коллекцию Category, и контроллеры
// долго отдавали его без populate. Клиент печатал значение как есть, а у
// бейджа стоит text-transform: uppercase — на странице научной статьи в
// шапке висело «6933BF85BE6A7AFE9295CE72» вместо названия рубрики. На
// публичной странице тот же идентификатор уходил в og:article:section и в
// JSON-LD, то есть попадал в выдачу.
//
// populate добавлен на сервере, но принимать оба вида ответа всё равно
// нужно: статья могла быть отдана старым кэшем или другим эндпоинтом,
// который ещё не поправлен, и тогда лучше показать пустоту, чем
// идентификатор.

/** 24 hex-символа — так выглядит ObjectId. */
const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * @param {unknown} category значение поля article.category
 * @returns {string} название рубрики или пустая строка
 */
export function categoryName(category) {
  if (!category) return "";
  if (typeof category === "object") {
    return typeof category.name === "string" ? category.name : "";
  }
  if (typeof category !== "string") return "";
  // Идентификатор пользователю показывать нечего.
  return OBJECT_ID.test(category.trim()) ? "" : category;
}

export default categoryName;
