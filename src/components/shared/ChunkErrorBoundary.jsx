// client/src/components/shared/ChunkErrorBoundary.jsx
//
// Белый экран при первом заходе, который лечится перезагрузкой.
//
// Причина. Все 567 страниц подключены через React.lazy и грузятся
// отдельными файлами, имя которых содержит хеш содержимого. После выката
// новой сборки имена меняются, а вкладка, открытая на старой версии,
// продолжает просить старые файлы. Сервер отвечает 404, import() падает,
// React снимает всё дерево — и остаётся пустая белая страница. Обновление
// страницы тянет свежий index.html, и всё работает: отсюда «иногда белый
// экран, после перезагрузки нормально».
//
// Границы ошибок в приложении не было вообще, поэтому ЛЮБАЯ ошибка при
// отрисовке давала тот же результат.
//
// Что делает эта граница:
//   • узнаёт именно сбой загрузки файла страницы и один раз молча
//     перезагружает вкладку — для человека это выглядит как обычная
//     загрузка, а не как поломка;
//   • перезагружает не больше одного раза за сессию вкладки: если после
//     обновления ошибка повторилась, дело не в устаревшем файле, и
//     бесконечный цикл перезагрузок был бы хуже самой ошибки;
//   • на любой другой ошибке показывает экран с кнопкой вместо белизны.

import React from "react";

const RELOAD_FLAG = "dp_chunk_reloaded";

// Формулировки различаются у webpack, Vite и Safari — ловим все.
function isChunkLoadError(error) {
  if (!error) return false;
  const name = String(error.name || "");
  const msg = String(error.message || "");
  return (
    name === "ChunkLoadError" ||
    /Loading chunk [\d\w]+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

export default class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, chunk: false };
  }

  static getDerivedStateFromError(error) {
    return { failed: true, chunk: isChunkLoadError(error) };
  }

  componentDidCatch(error, info) {
    // Лог нужен: без него причина белого экрана не восстанавливается.
    console.error("[ChunkErrorBoundary]", error, info?.componentStack);

    if (!isChunkLoadError(error)) return;

    let already = false;
    try {
      already = window.sessionStorage.getItem(RELOAD_FLAG) === "1";
      if (!already) window.sessionStorage.setItem(RELOAD_FLAG, "1");
    } catch {
      // Приватный режим — хранилище недоступно. Тогда не перезагружаем
      // автоматически: без флага цикл перезагрузок не остановить.
      already = true;
    }

    if (!already) window.location.reload();
  }

  handleReload = () => {
    try {
      window.sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      /* не критично */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;

    // Сюда попадаем, если перезагрузка уже была или ошибка не про загрузку
    // файла. Показываем экран, с которого можно уйти, а не белизну.
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          textAlign: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
          color: "#1f2937",
        }}
      >
        <div style={{ fontSize: 40 }} aria-hidden="true">
          ⚠️
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: "#0f172a" }}>
          Страница не открылась
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 460, color: "#475569" }}>
          {this.state.chunk
            ? "Не удалось загрузить часть приложения. Обычно помогает обновление страницы."
            : "При отрисовке страницы произошла ошибка. Данные не потеряны."}
        </div>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            padding: "12px 26px",
            border: "none",
            borderRadius: 10,
            background: "#0f766e",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Обновить страницу
        </button>
      </div>
    );
  }
}
