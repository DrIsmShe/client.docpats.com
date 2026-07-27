// client/src/pages/radiology/RadiologyLegacyRedirect.jsx
//
// Переезд раздела: /radiology/* → /arena/*
//
// Зачем компонент, а не пять отдельных <Navigate>: сохраняется остаток пути,
// строка запроса и якорь. Ссылка вида /radiology/cases/abc?duel=xyz ведёт на
// тот же кейс той же дуэли, а не на общий каталог — иначе врач, открывший
// вызов из переписки, потерял бы дуэль и не понял почему.
//
// replace, а не push: страницы-перенаправления не должно быть в истории, иначе
// кнопка «назад» из кейса возвращает на неё и снова кидает вперёд.

import { Navigate, useLocation } from "react-router-dom";

export default function RadiologyLegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  const next = `${pathname.replace(/^\/radiology/, "/arena")}${search}${hash}`;
  return <Navigate to={next} replace />;
}
