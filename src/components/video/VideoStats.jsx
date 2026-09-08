// client/src/components/video/VideoStats.jsx
//
// Что стало с роликом после публикации.
//
// ГЛАВНОЕ ЧИСЛО ЗДЕСЬ — НЕ ПРОСМОТРЫ, А ДОСМОТРЫ. Просмотр говорит лишь,
// что страницу открыли; работу ролика выполняет досмотр. Объяснение перед
// процедурой, которое бросают на пятнадцатой секунде, надо переснимать —
// и лучше узнать об этом раньше, чем придёт неподготовленный пациент.
//
// ПОЛОСА ОТТОКА — ПЯТЬ ОТРЕЗКОВ. Точнее без покадровой телеметрии не
// скажешь, а «бросают в первой трети» — уже достаточный повод пересобрать
// начало.
//
// ЗРИТЕЛЕЙ ЗДЕСЬ НЕТ И НЕ БУДЕТ. Под роликом о подготовке к колоноскопии
// список зрителей — это список пациентов с подозрением на диагноз.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchVideoStats } from "../../api/video";

export default function VideoStats({ videoId }) {
  const { t } = useTranslation();
  const [данные, setДанные] = useState(null);
  const [беда, setБеда] = useState("");

  useEffect(() => {
    let живо = true;
    fetchVideoStats(videoId)
      .then((д) => живо && setДанные(д))
      .catch(() =>
        живо &&
        setБеда(
          t("videra.stats.failed", { defaultValue: "Не удалось загрузить статистику" }),
        ),
      );
    return () => {
      живо = false;
    };
  }, [videoId, t]);

  if (беда) return <div style={стиль.блок}>{беда}</div>;
  if (!данные) {
    return (
      <div style={стиль.блок}>
        {t("videra.stats.loading", { defaultValue: "Считаем…" })}
      </div>
    );
  }

  const максимум = Math.max(...(данные.dropoff || [0]), 1);

  return (
    <div style={стиль.блок}>
      <div style={стиль.заголовок}>
        {t("videra.stats.title", { defaultValue: "Как смотрят" })}{" "}
        <span style={стиль.период}>
          {t("videra.stats.days", {
            count: данные.days,
            defaultValue: "за {{count}} дней",
          })}
        </span>
      </div>

      <div style={стиль.числа}>
        <Число
          знак={данные.completionRate + "%"}
          подпись={t("videra.stats.completionRate", {
            defaultValue: "досматривают",
          })}
          главное
        />
        <Число
          знак={данные.averageDepth + "%"}
          подпись={t("videra.stats.depth", { defaultValue: "средняя глубина" })}
        />
        <Число
          знак={данные.watches}
          подпись={t("videra.stats.watches", { defaultValue: "засчитано просмотров" })}
        />
        <Число
          знак={данные.views}
          подпись={t("videra.stats.views", { defaultValue: "открытий страницы" })}
        />
      </div>

      {данные.watches > 0 && (
        <>
          <div style={стиль.подпись}>
            {t("videra.stats.dropoff", {
              defaultValue: "Докуда досматривают (по пятым долям ролика)",
            })}
          </div>
          <div style={стиль.полоса}>
            {(данные.dropoff || []).map((сколько, i) => (
              <div key={i} style={стиль.столбец}>
                <div
                  style={{
                    ...стиль.столбик,
                    height: `${Math.round((сколько / максимум) * 100)}%`,
                  }}
                  title={`${сколько}`}
                />
                <div style={стиль.метка}>{(i + 1) * 20}%</div>
              </div>
            ))}
          </div>
        </>
      )}

      {данные.watches === 0 && (
        <div style={стиль.пусто}>
          {t("videra.stats.noWatches", {
            defaultValue:
              "Пока никто не досмотрел ни разу — статистика появится после первых просмотров.",
          })}
        </div>
      )}
    </div>
  );
}

function Число({ знак, подпись, главное }) {
  return (
    <div style={стиль.число}>
      <div style={главное ? стиль.знакГлавный : стиль.знак}>{знак}</div>
      <div style={стиль.знакПодпись}>{подпись}</div>
    </div>
  );
}

const стиль = {
  блок: {
    border: "1px dashed #d6dddb",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  заголовок: { fontWeight: 700, fontSize: 14 },
  период: { fontWeight: 400, fontSize: 12, color: "#6b7b78" },
  числа: { display: "flex", gap: 20, flexWrap: "wrap" },
  число: { minWidth: 92 },
  знак: { fontSize: 20, fontWeight: 700 },
  знакГлавный: { fontSize: 26, fontWeight: 800, color: "#0e8478" },
  знакПодпись: { fontSize: 12, color: "#6b7b78" },
  подпись: { fontSize: 12, color: "#6b7b78", marginTop: 4 },
  полоса: {
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
    height: 90,
  },
  столбец: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    height: "100%",
    gap: 4,
  },
  столбик: {
    width: "100%",
    background: "#0e8478",
    borderRadius: "6px 6px 0 0",
    minHeight: 2,
  },
  метка: { fontSize: 11, color: "#6b7b78" },
  пусто: { fontSize: 13, color: "#6b7b78" },
};
