// client/src/lib/staleStyleGuard.js
//
// Страница без оформления после выката новой сборки.
//
// ПРИЧИНА ТА ЖЕ, что у белого экрана (см. ChunkErrorBoundary): имена
// файлов содержат хеш содержимого, после выката они меняются, а вкладка,
// открытая на старой версии, продолжает просить старые. Сервер отвечает
// 404.
//
// НО ВЕДЁТ СЕБЯ ЭТО ИНАЧЕ. Упавший файл СКРИПТА роняет import(), React
// снимает дерево, и граница ошибок это ловит. Упавший файл СТИЛЕЙ не
// роняет ничего: разметка честно рисуется, просто голой. Ошибки нет,
// ловить нечего — человек видит чёрный фон и системные поля браузера и
// думает, что сайт сломан.
//
// Отсюда и отдельная защита: ошибки загрузки ресурсов не всплывают, их
// видно только в фазе перехвата на window.
//
// ЧТО ОГРАНИЧЕНО НАМЕРЕННО:
//   • только свои файлы. Заблокированный шрифт с чужого домена — обычное
//     дело в сетях с фильтрацией, и перезагружать из-за него страницу
//     значит зациклить её у всех, у кого он заблокирован;
//   • одна перезагрузка за сессию вкладки, и ключ общий с границей
//     ошибок. Если после обновления стили снова не пришли, дело не в
//     устаревшем файле, и цикл перезагрузок будет хуже голой вёрстки.

// Тот же ключ, что у ChunkErrorBoundary: причина одна, и вкладка должна
// перезагрузиться один раз, а не по разу на каждую разновидность сбоя.
const RELOAD_FLAG = "dp_chunk_reloaded";

function ownAsset(href) {
  if (!href) return false;
  try {
    return new URL(href, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function reloadOnce() {
  let already = false;
  try {
    already = window.sessionStorage.getItem(RELOAD_FLAG) === "1";
    if (!already) window.sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // Приватный режим — хранилища нет. Без флага цикл не остановить,
    // поэтому не перезагружаем вовсе.
    already = true;
  }
  if (!already) window.location.reload();
}

export function installStaleStyleGuard() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "error",
    (event) => {
      const el = event?.target;
      // event.target === window означает обычную ошибку в скрипте — ею
      // занимается граница ошибок, а не мы.
      if (!el || el === window || el.tagName !== "LINK") return;
      if (String(el.rel || "").toLowerCase() !== "stylesheet") return;
      if (!ownAsset(el.href)) return;

      console.warn("[staleStyleGuard] не загрузился файл стилей:", el.href);
      reloadOnce();
    },
    // Перехват: ошибки загрузки ресурсов не всплывают, и без true сюда
    // не дойдёт ничего.
    true,
  );
}

export default installStaleStyleGuard;
