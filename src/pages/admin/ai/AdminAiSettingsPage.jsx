// client/src/pages/admin/ai/AdminAiSettingsPage.jsx
//
// Какой моделью работает платформа — одно место на весь проект.
//
// ЗАЧЕМ ЭКРАН. Раньше провайдер был вшит в код каждой подсистемы: перевод
// ходил в OpenAI, разборы — в Claude, и узнать это можно было только чтением
// исходников. Когда на счету OpenAI кончились деньги, статьи врачей молча
// перестали переводиться: в логах воркера ошибка была, на сайте — нет.
//
// ЧТО ЗДЕСЬ МОЖНО. Выбрать провайдера по умолчанию и переопределить его для
// каждой части отдельно: перевод — дешёвой быстрой моделью, клинические
// разборы — сильной. Пустое поле модели означает «по умолчанию этого
// провайдера»: так экран не придётся править каждый раз, когда выходит
// новая версия модели.
//
// ЧЕГО ЗДЕСЬ НЕТ. Ключей API. Они живут в окружении сервера: ключ, попавший
// в базу, попадает и в резервную копию, и в выгрузку.

import React, { useCallback, useEffect, useState } from "react";
import axios from "../../../axios";

const ИМЕНА_ПРОВАЙДЕРОВ = {
  anthropic: "Anthropic · Claude",
  openai: "OpenAI · GPT",
};

const ИМЕНА_НАЗНАЧЕНИЙ = {
  translation: "Перевод",
  chat: "Чат",
  summary: "Выжимки",
  consultation: "Консультации и разборы",
  speech: "Распознавание речи",
  image: "Генерация изображений",
};

export default function AdminAiSettingsPage() {
  const [состояние, setСостояние] = useState(null);
  const [беда, setБеда] = useState("");
  const [готово, setГотово] = useState("");
  const [занят, setЗанят] = useState(false);

  const загрузить = useCallback(async () => {
    setБеда("");
    try {
      const { data } = await axios.get("/admin/ai-settings");
      setСостояние(data);
    } catch (о) {
      setБеда(о?.response?.data?.message || "Не удалось загрузить настройки");
    }
  }, []);

  useEffect(() => {
    загрузить();
  }, [загрузить]);

  async function сохранить(тело, что) {
    setЗанят(true);
    setБеда("");
    setГотово("");
    try {
      const { data } = await axios.patch("/admin/ai-settings", тело);
      setСостояние((п) => ({ ...п, provider: data.provider, tasks: data.tasks }));
      setГотово(`Сохранено: ${что}. Действует со следующего задания.`);
    } catch (о) {
      setБеда(о?.response?.data?.message || "Не удалось сохранить");
    } finally {
      setЗанят(false);
    }
  }

  if (!состояние) {
    return (
      <div style={стиль.страница}>
        <h1 style={стиль.заголовок}>Модели ИИ</h1>
        <p style={стиль.тихо}>{беда || "Загружаем…"}</p>
      </div>
    );
  }

  const каталог = состояние.catalog || { providers: [], tasks: [] };

  return (
    <div style={стиль.страница}>
      <h1 style={стиль.заголовок}>Модели ИИ</h1>
      <p style={стиль.лид}>
        Одно место, где решается, какой моделью работает платформа. Провайдер
        по умолчанию действует на всё; ниже его можно переопределить для
        каждой части отдельно. Изменения применяются со следующего задания —
        без перезапуска сервера.
      </p>

      {беда ? <div style={стиль.ошибка}>{беда}</div> : null}
      {готово ? <div style={стиль.успех}>{готово}</div> : null}

      <section style={стиль.карта}>
        <h2 style={стиль.подзаголовок}>Провайдер по умолчанию</h2>
        <div style={стиль.строка}>
          <select
            style={стиль.поле}
            value={состояние.provider}
            disabled={занят}
            onChange={(e) =>
              сохранить({ provider: e.target.value }, "провайдер по умолчанию")
            }
          >
            {каталог.providers.map((п) => (
              <option key={п} value={п}>
                {ИМЕНА_ПРОВАЙДЕРОВ[п] || п}
              </option>
            ))}
          </select>
          {состояние.lastChange ? (
            <span style={стиль.тихо}>
              {состояние.lastChange}
              {состояние.updatedAt
                ? ` · ${new Date(состояние.updatedAt).toLocaleString()}`
                : ""}
            </span>
          ) : null}
        </div>
      </section>

      <section style={стиль.карта}>
        <h2 style={стиль.подзаголовок}>По частям проекта</h2>
        <p style={стиль.сноска}>
          Пустое поле модели — «по умолчанию выбранного провайдера». Так экран
          не придётся править, когда выйдет следующая версия модели.
        </p>

        <div style={стиль.таблица}>
          {каталог.tasks.map((задача) => (
            <НазначениеСтрока
              key={задача.key}
              задача={задача}
              текущее={состояние.tasks?.[задача.key] || {}}
              занят={занят}
              onSave={(значение) =>
                сохранить(
                  { tasks: { [задача.key]: значение } },
                  ИМЕНА_НАЗНАЧЕНИЙ[задача.key] || задача.key,
                )
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function НазначениеСтрока({ задача, текущее, занят, onSave }) {
  const [провайдер, setПровайдер] = useState(текущее.provider || "");
  const [модель, setМодель] = useState(текущее.model || "");

  useEffect(() => {
    setПровайдер(текущее.provider || "");
    setМодель(текущее.model || "");
  }, [текущее.provider, текущее.model]);

  const изменено =
    провайдер !== (текущее.provider || "") || модель !== (текущее.model || "");

  return (
    <div style={стиль.ряд}>
      <div style={стиль.ячейкаИмя}>
        <div style={стиль.имяЗадачи}>
          {ИМЕНА_НАЗНАЧЕНИЙ[задача.key] || задача.key}
        </div>
        <div style={стиль.сноска}>{задача.title}</div>
        {задача.openaiOnly ? (
          <div style={стиль.пометка}>
            Только OpenAI: у Anthropic такого API нет
          </div>
        ) : null}
      </div>

      <select
        style={стиль.поле}
        value={провайдер}
        disabled={занят || задача.openaiOnly}
        onChange={(e) => setПровайдер(e.target.value)}
      >
        <option value="">как по умолчанию</option>
        {Object.keys(задача.defaults || {}).map((п) => (
          <option key={п} value={п}>
            {ИМЕНА_ПРОВАЙДЕРОВ[п] || п}
          </option>
        ))}
      </select>

      <input
        style={стиль.поле}
        value={модель}
        disabled={занят}
        placeholder={
          задача.defaults?.[провайдер || текущее.provider] || "модель по умолчанию"
        }
        onChange={(e) => setМодель(e.target.value)}
      />

      <button
        type="button"
        style={изменено ? стиль.кнопка : стиль.кнопкаТихая}
        disabled={занят || !изменено}
        onClick={() => onSave({ provider: провайдер || null, model: модель })}
      >
        Сохранить
      </button>
    </div>
  );
}

const стиль = {
  страница: { padding: 16, maxWidth: 1100, margin: "0 auto" },
  заголовок: { margin: 0, fontSize: 22, fontWeight: 700 },
  лид: { margin: "6px 0 16px", color: "#666", fontSize: 13, maxWidth: 760, lineHeight: 1.6 },
  карта: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    marginBottom: 16,
  },
  подзаголовок: { margin: "0 0 10px", fontSize: 16, fontWeight: 600 },
  строка: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  таблица: { display: "grid", gap: 10 },
  ряд: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 2fr) minmax(150px, 1fr) minmax(150px, 1fr) auto",
    gap: 10,
    alignItems: "center",
    padding: "10px 0",
    borderTop: "1px solid #f0f0f0",
  },
  ячейкаИмя: { minWidth: 0 },
  имяЗадачи: { fontWeight: 600, fontSize: 14 },
  сноска: { fontSize: 12, color: "#888", lineHeight: 1.5 },
  пометка: { fontSize: 11, color: "#b45309", marginTop: 4 },
  поле: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "8px 10px",
    font: "inherit",
    fontSize: 13,
    minHeight: 38,
    boxSizing: "border-box",
    width: "100%",
  },
  кнопка: {
    border: "none",
    background: "#0f0f0f",
    color: "#fff",
    borderRadius: 18,
    padding: "8px 16px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  кнопкаТихая: {
    border: "none",
    background: "#f2f2f2",
    color: "#999",
    borderRadius: 18,
    padding: "8px 16px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "default",
  },
  ошибка: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    fontSize: 13,
    marginBottom: 12,
  },
  успех: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(15,118,110,.08)",
    color: "#0f766e",
    fontSize: 13,
    marginBottom: 12,
  },
  тихо: { color: "#888", fontSize: 12 },
};
