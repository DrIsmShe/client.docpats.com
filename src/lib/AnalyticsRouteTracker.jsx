// client/src/lib/AnalyticsRouteTracker.jsx
//
// Отправляет просмотр экрана на каждую смену маршрута. Ничего не рисует.
//
// Живёт отдельным компонентом, а не хуком внутри App: useLocation работает
// только внутри BrowserRouter, а App объявлен снаружи него.
//
// Путь нормализуется до шаблона (/clinic/patients/:id) — см. analytics.js:
// сырой адрес содержит идентификатор записи и наружу уходить не должен.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "./analytics";

export default function AnalyticsRouteTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
