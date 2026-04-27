// src/pages/simulation/components/editor/EditorFullScreenWrapper.jsx
//
// Универсальная обёртка которая делает SimulationEditor full-screen
// (вся доступная высота окна минус header страницы).
//
// Использование на странице плана:
//
//   import EditorFullScreenWrapper from "../components/editor/EditorFullScreenWrapper.jsx";
//
//   <EditorFullScreenWrapper>
//     <SimulationEditor plan={plan} />
//   </EditorFullScreenWrapper>
//
// Wrapper сам определит сколько места осталось от viewport и заполнит
// его. На phone он становится 100vh (включая header — тоже full screen).

import React, { useEffect, useRef, useState } from "react";

export default function EditorFullScreenWrapper({ children, minHeight = 600 }) {
  const wrapperRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      // Высота от верха wrapper'а до низа окна, минус небольшой отступ
      const available = window.innerHeight - rect.top - 16;
      setHeight(Math.max(available, minHeight));
    };

    updateHeight();

    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);
    // Также пересчитываем когда DOM меняется (header появился/исчез)
    const observer = new ResizeObserver(updateHeight);
    if (wrapperRef.current?.parentElement) {
      observer.observe(wrapperRef.current.parentElement);
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
      observer.disconnect();
    };
  }, [minHeight]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        height: height ? `${height}px` : "auto",
        minHeight: `${minHeight}px`,
        display: "flex",
      }}
    >
      {children}
    </div>
  );
}
