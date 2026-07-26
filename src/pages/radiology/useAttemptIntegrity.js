// client/src/pages/radiology/useAttemptIntegrity.js
//
// Сбор сигналов добросовестности зачётной попытки: вставки текста в поля,
// время вне вкладки, число переключений. Отправляется вместе со сдачей.
//
// Честно о границах: всё это подделывается — браузер можно научить присылать
// нули, а телефон рядом никакая страница не увидит. Поэтому сигналы служат
// пометкой автору кейса, а не доказательством, и на балл не влияют
// (integrity.service.js на сервере). Отсутствие сигналов там же трактуется
// как «данных нет», а не как «всё чисто».
//
// В зачётном режиме вставка в поля ответа блокируется. Это не защита (кто
// хочет — перепечатает руками), а честное обозначение правила: сюда пишут
// сами. В тренировке вставка разрешена — там ИИ и не запрещён.

import { useCallback, useEffect, useRef } from "react";

export default function useAttemptIntegrity({ active, blockPaste }) {
  const stats = useRef({ pasteEvents: 0, pastedChars: 0, hiddenMs: 0, focusLosses: 0 });
  const hiddenSince = useRef(null);

  // Время вне вкладки. Считаем по visibilitychange, а не по blur: blur ловит
  // и клик по адресной строке, что шумно и ни о чём не говорит.
  useEffect(() => {
    if (!active) return undefined;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenSince.current = Date.now();
        stats.current.focusLosses += 1;
      } else if (hiddenSince.current) {
        stats.current.hiddenMs += Date.now() - hiddenSince.current;
        hiddenSince.current = null;
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      // Уходя со страницы, закрываем незакрытый интервал.
      if (hiddenSince.current) {
        stats.current.hiddenMs += Date.now() - hiddenSince.current;
        hiddenSince.current = null;
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active]);

  /** Навесить на textarea/input с ответом: onPaste={onPaste}. */
  const onPaste = useCallback(
    (event) => {
      const text = event.clipboardData?.getData("text") ?? "";
      stats.current.pasteEvents += 1;
      stats.current.pastedChars += text.length;
      if (blockPaste) event.preventDefault();
    },
    [blockPaste],
  );

  /** Снимок для отправки со сдачей. */
  const collect = useCallback(() => {
    const pending = hiddenSince.current ? Date.now() - hiddenSince.current : 0;
    return {
      pasteEvents: stats.current.pasteEvents,
      pastedChars: stats.current.pastedChars,
      hiddenMs: Math.round(stats.current.hiddenMs + pending),
      focusLosses: stats.current.focusLosses,
    };
  }, []);

  return { onPaste, collect };
}
