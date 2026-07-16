// client/src/lib/sanitizeHtml.js
//
// Единая точка санитизации HTML перед dangerouslySetInnerHTML.
//
// ЗАЧЕМ: контент статей, био врачей, медицинских шаблонов и т.п. — это HTML,
// созданный пользователями (через CKEditor/Quill). Рендер его напрямую через
// dangerouslySetInnerHTML без очистки = stored XSS: автор (или тот, кто угнал
// его аккаунт) вставляет <script>/onerror — код выполняется у КАЖДОГО читателя,
// включая пациентов. DOMPurify вырезает скрипты/обработчики событий, оставляя
// безопасную разметку.
//
// Использование:
//   import { sh } from "../../../lib/sanitizeHtml";
//   <div dangerouslySetInnerHTML={{ __html: sh(article.content) }} />

import DOMPurify from "dompurify";

/**
 * Очистить строку HTML от исполняемого кода. null/undefined → "".
 * @param {string} dirty
 * @returns {string}
 */
export function sh(dirty) {
  if (dirty == null) return "";
  return DOMPurify.sanitize(String(dirty), {
    // target=_blank ссылки безопасны, но DOMPurify по умолчанию их не трогает.
    // Явно запрещаем javascript: и data: в href/src через дефолтную политику.
    USE_PROFILES: { html: true },
  });
}

export default sh;
