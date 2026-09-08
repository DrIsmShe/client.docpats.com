// client/src/pages/admin/video/AdminVideoCategories.jsx
//
// Разделы витрины: добавить, переименовать, переставить, выключить, удалить.
//
// УДАЛЕНИЕ СНИМАЕТ ПОЛКУ, А НЕ РОЛИКИ. Ролики остаются и уходят в общую
// ленту; сколько их освободилось, сервер возвращает числом. Это сказано и в
// вопросе перед удалением: администратор распоряжается чужими материалами и
// должен понимать, что именно с ними произойдёт.
//
// ВЫКЛЮЧИТЬ ЧАЩЕ ПРАВИЛЬНЕЕ, ЧЕМ УДАЛИТЬ: выключенный раздел исчезает с
// витрины, ролики остаются на своих местах, и решение обратимо.

import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminFetchCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "../../../api/video";

const ЯЗЫКИ = ["ru", "en", "az", "tr", "ar"];

export default function AdminVideoCategories() {
  const { t } = useTranslation();
  const [разделы, setРазделы] = useState(null);
  const [беда, setБеда] = useState("");
  const [новый, setНовый] = useState({ slug: "", ru: "", order: 100 });
  const [правка, setПравка] = useState(null);

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      setРазделы(await adminFetchCategories());
    } catch (e) {
      setБеда(
        e?.response?.data?.message ||
          t("videra.cat.loadFailed", { defaultValue: "Не удалось загрузить разделы" }),
      );
      setРазделы([]);
    }
  }, [t]);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  const действие = async (работа) => {
    setБеда("");
    try {
      await работа();
      await загрузить();
    } catch (e) {
      setБеда(
        e?.response?.data?.message ||
          t("videra.cat.failed", { defaultValue: "Не удалось выполнить действие" }),
      );
    }
  };

  const создать = () => {
    if (!новый.slug.trim() || !новый.ru.trim()) return;
    действие(async () => {
      await adminCreateCategory({
        slug: новый.slug.trim(),
        title: { ru: новый.ru.trim() },
        order: Number(новый.order) || 100,
      });
      setНовый({ slug: "", ru: "", order: 100 });
    });
  };

  const удалить = (к) => {
    const вопрос = t("videra.cat.confirmDelete", {
      title: к.title?.ru || к.slug,
      count: к.count || 0,
      defaultValue:
        "Удалить раздел «{{title}}»? Роликов на нём: {{count}} — они останутся, но потеряют раздел.",
    });
    if (window.confirm(вопрос)) действие(() => adminDeleteCategory(к._id));
  };

  if (разделы === null) {
    return (
      <div style={стиль.пусто}>
        {t("videra.cat.loading", { defaultValue: "Загружаем…" })}
      </div>
    );
  }

  return (
    <div style={стиль.блок}>
      <h2 style={стиль.заголовок}>
        {t("videra.cat.title", { defaultValue: "Разделы витрины" })}
      </h2>
      <p style={стиль.подпись}>
        {t("videra.cat.subtitle", {
          defaultValue:
            "То, что зритель видит чипсами на странице роликов. Порядок задаётся числом: меньше — левее.",
        })}
      </p>

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      <div style={стиль.создание}>
        <input
          value={новый.slug}
          onChange={(e) => setНовый({ ...новый, slug: e.target.value })}
          placeholder={t("videra.cat.slug", { defaultValue: "ключ-латиницей" })}
          style={стиль.поле}
        />
        <input
          value={новый.ru}
          onChange={(e) => setНовый({ ...новый, ru: e.target.value })}
          placeholder={t("videra.cat.name", { defaultValue: "Название" })}
          style={{ ...стиль.поле, flex: 1, minWidth: 160 }}
        />
        <input
          type="number"
          value={новый.order}
          onChange={(e) => setНовый({ ...новый, order: e.target.value })}
          style={{ ...стиль.поле, width: 90 }}
          aria-label={t("videra.cat.order", { defaultValue: "Порядок" })}
        />
        <button type="button" onClick={создать} style={стиль.кнопкаГлавная}>
          {t("videra.cat.add", { defaultValue: "Добавить" })}
        </button>
      </div>

      <div style={стиль.список}>
        {разделы.map((к) => (
          <div key={к._id} style={стиль.строка}>
            {правка?.id === к._id ? (
              <>
                <input
                  value={правка.slug}
                  onChange={(e) => setПравка({ ...правка, slug: e.target.value })}
                  style={{ ...стиль.поле, width: 150 }}
                />
                {/* Пять полей названия: раздел видят на пяти языках, и
                    заводить их удобнее сразу, а не по одному заходу. */}
                {ЯЗЫКИ.map((я) => (
                  <input
                    key={я}
                    value={правка.title[я] || ""}
                    onChange={(e) =>
                      setПравка({
                        ...правка,
                        title: { ...правка.title, [я]: e.target.value },
                      })
                    }
                    placeholder={я}
                    style={{ ...стиль.поле, width: 110 }}
                  />
                ))}
                <input
                  type="number"
                  value={правка.order}
                  onChange={(e) => setПравка({ ...правка, order: e.target.value })}
                  style={{ ...стиль.поле, width: 80 }}
                />
                <button
                  type="button"
                  style={стиль.кнопкаГлавная}
                  onClick={() =>
                    действие(async () => {
                      await adminUpdateCategory(к._id, {
                        slug: правка.slug,
                        title: правка.title,
                        order: Number(правка.order) || 100,
                      });
                      setПравка(null);
                    })
                  }
                >
                  {t("videra.cat.save", { defaultValue: "Сохранить" })}
                </button>
                <button
                  type="button"
                  style={стиль.кнопка}
                  onClick={() => setПравка(null)}
                >
                  {t("videra.cat.cancel", { defaultValue: "Отмена" })}
                </button>
              </>
            ) : (
              <>
                <span style={стиль.порядок}>{к.order}</span>
                <span style={стиль.имя}>{к.title?.ru || к.slug}</span>
                <span style={стиль.ключ}>{к.slug}</span>
                <span style={стиль.счёт}>
                  {t("videra.cat.count", {
                    count: к.count || 0,
                    defaultValue: "{{count}} роликов",
                  })}
                </span>
                {!к.active && (
                  <span style={стиль.выключен}>
                    {t("videra.cat.off", { defaultValue: "выключен" })}
                  </span>
                )}
                <button
                  type="button"
                  style={стиль.кнопка}
                  onClick={() =>
                    setПравка({
                      id: к._id,
                      slug: к.slug,
                      title: { ...(к.title || {}) },
                      order: к.order,
                    })
                  }
                >
                  {t("videra.cat.edit", { defaultValue: "Править" })}
                </button>
                <button
                  type="button"
                  style={стиль.кнопка}
                  onClick={() =>
                    действие(() => adminUpdateCategory(к._id, { active: !к.active }))
                  }
                >
                  {к.active
                    ? t("videra.cat.disable", { defaultValue: "Выключить" })
                    : t("videra.cat.enable", { defaultValue: "Включить" })}
                </button>
                <button
                  type="button"
                  style={{ ...стиль.кнопка, ...стиль.кнопкаОпасная }}
                  onClick={() => удалить(к)}
                >
                  {t("videra.cat.delete", { defaultValue: "Удалить" })}
                </button>
              </>
            )}
          </div>
        ))}
        {разделы.length === 0 && (
          <div style={стиль.пусто}>
            {t("videra.cat.empty", {
              defaultValue: "Разделов нет — витрина показывает всё одной лентой.",
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const стиль = {
  блок: {
    border: "1px solid #d6dddb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    background: "#fff",
  },
  заголовок: { fontSize: 18, fontWeight: 700, margin: 0 },
  подпись: { margin: "4px 0 14px", fontSize: 13, color: "#6b7b78" },
  создание: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
  список: { display: "flex", flexDirection: "column", gap: 8 },
  строка: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
    borderTop: "1px solid #e4e9e8",
    paddingTop: 8,
  },
  порядок: {
    width: 34,
    color: "#6b7b78",
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
  },
  имя: { fontWeight: 600, fontSize: 14, minWidth: 140 },
  ключ: { fontSize: 12, color: "#6b7b78", fontFamily: "monospace" },
  счёт: { fontSize: 12, color: "#6b7b78" },
  выключен: { fontSize: 12, color: "#c4570d", fontWeight: 700 },
  поле: {
    border: "1px solid #d6dddb",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
    font: "inherit",
  },
  кнопка: {
    border: "1px solid #d6dddb",
    background: "transparent",
    borderRadius: 8,
    padding: "5px 10px",
    fontSize: 12,
    cursor: "pointer",
    color: "inherit",
  },
  кнопкаГлавная: {
    border: "1px solid #0e8478",
    background: "#0e8478",
    color: "#fff",
    borderRadius: 8,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  кнопкаОпасная: { borderColor: "rgba(163,44,34,.4)", color: "#a32c22" },
  пусто: { padding: 20, textAlign: "center", color: "#6b7b78", fontSize: 13 },
  ошибка: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    marginBottom: 12,
    fontSize: 13,
  },
};
