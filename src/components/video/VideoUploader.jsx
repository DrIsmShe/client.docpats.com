// client/src/components/video/VideoUploader.jsx
//
// Загрузка готового ролика со стороны — файлом.
//
// ФАЙЛ ИДЁТ ПРЯМО В ХРАНИЛИЩЕ. Сервер выдаёт подписанную ссылку, браузер
// льёт файл по ней и только потом сообщает «готово». Через наш сервер
// сотни мегабайт не идут — он бы держал память и поток на всё время
// передачи, и три одновременные загрузки положили бы приём.
//
// ПРЕДЕЛЫ ПРОВЕРЯЮТСЯ ДО ОТПРАВКИ. Длительность и размер видно на клиенте
// сразу: сказать «слишком длинный» до загрузки честнее, чем после того, как
// человек десять минут ждал полосу прогресса. Настоящая проверка всё равно
// на сервере — эта только бережёт время.
//
// ПРЕВЬЮ ДЕЛАЕМ САМИ, кадром из середины ролика. Просить у человека
// отдельную картинку — потерять половину загрузок на этом шаге, а первый
// кадр у видео почти всегда чёрный.

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  prepareUpload,
  completeUpload,
  directUpload,
  fetchUploadRules,
  fetchCategories,
} from "../../api/video";

/** Те же числа, что и на сервере. Расхождение здесь — отказ после загрузки. */
const МАКС_СЕКУНД = 600;
const МАКС_БАЙТ = 300 * 1024 * 1024;
const ТИПЫ = ["video/mp4", "video/webm", "video/quicktime"];

/* Разрешение. Верх — Full HD: больше не нужно ни на одном экране, где
   смотрят объяснение, а вес растёт вдвое. Низ — чтобы отсеять случайно
   выбранную миниатюру или скринкаст в четверть экрана. */
const МАКС_ШИРИНА = 1920;
const МАКС_ВЫСОТА = 1080;
const МИН_ШИРИНА = 320;
const МИН_ВЫСОТА = 240;

/** Метаданные файла: длительность и кадр для превью. */
function разобрать(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;

    const провал = (причина) => {
      URL.revokeObjectURL(url);
      reject(new Error(причина));
    };

    video.onerror = () => провал("unreadable");
    video.onloadedmetadata = () => {
      const секунд = Math.round(video.duration);
      // Кадр берём из середины: начало у роликов часто чёрное.
      video.currentTime = Math.min(секунд / 2, Math.max(1, секунд - 1));
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve({
            durationSec: Math.round(video.duration),
            width: video.videoWidth,
            height: video.videoHeight,
            poster: blob,
          });
        },
        "image/jpeg",
        0.8,
      );
    };
  });
}

/** PUT в хранилище с полосой прогресса. fetch её не даёт — берём XHR. */
function залить(url, blob, тип, наПрогресс) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", тип);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && наПрогресс) {
        наПрогресс(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`хранилище ответило ${xhr.status}`));
    xhr.onerror = () => reject(new Error("сеть"));
    xhr.send(blob);
  });
}

export default function VideoUploader({ onDone }) {
  const { t } = useTranslation();
  const поле = useRef(null);
  const [файл, setФайл] = useState(null);
  const [мета, setМета] = useState(null);
  const [название, setНазвание] = useState("");
  const [описание, setОписание] = useState("");
  const [прогресс, setПрогресс] = useState(null);
  const [беда, setБеда] = useState("");
  const [правила, setПравила] = useState(null);
  const [раздел, setРаздел] = useState("");
  const [разделы, setРазделы] = useState([]);
  const [согласен, setСогласен] = useState(false);
  const [правилаРаскрыты, setПравилаРаскрыты] = useState(false);

  // Правила тянем с сервера: их версию потом отправляем вместе с заявкой,
  // и подпись должна стоять под тем текстом, который знает сервер.
  useEffect(() => {
    let живо = true;
    fetchUploadRules()
      .then((п) => живо && setПравила(п))
      .catch(() => живо && setПравила(null));
    // Разделы витрины — те, что настроил администратор. «Без раздела» тоже
    // допустимо: полку можно выбрать позже, в списке своих роликов.
    fetchCategories()
      .then((к) => живо && setРазделы(к))
      .catch(() => живо && setРазделы([]));
    return () => {
      живо = false;
    };
  }, []);

  const выбрать = async (e) => {
    const f = e.target.files?.[0];
    setБеда("");
    setМета(null);
    setФайл(null);
    if (!f) return;

    if (!ТИПЫ.includes(f.type)) {
      setБеда(
        t("videra.upload.badType", {
          defaultValue: "Подойдут MP4, WebM или MOV",
        }),
      );
      return;
    }
    if (f.size > МАКС_БАЙТ) {
      setБеда(
        t("videra.upload.tooBig", {
          mb: Math.round(МАКС_БАЙТ / 1024 / 1024),
          defaultValue: "Файл больше {{mb}} МБ загрузить нельзя",
        }),
      );
      return;
    }

    try {
      const м = await разобрать(f);
      if (м.durationSec > МАКС_СЕКУНД) {
        setБеда(
          t("videra.upload.tooLong", {
            min: Math.round(МАКС_СЕКУНД / 60),
            defaultValue: "Ролик длиннее {{min}} минут загрузить нельзя",
          }),
        );
        return;
      }
      if (м.width > МАКС_ШИРИНА || м.height > МАКС_ВЫСОТА) {
        setБеда(
          t("videra.upload.tooLarge", {
            w: МАКС_ШИРИНА,
            h: МАКС_ВЫСОТА,
            defaultValue: "Кадр больше {{w}}×{{h}} — уменьшите разрешение",
          }),
        );
        return;
      }
      if (м.width < МИН_ШИРИНА || м.height < МИН_ВЫСОТА) {
        setБеда(
          t("videra.upload.tooSmall", {
            w: МИН_ШИРИНА,
            h: МИН_ВЫСОТА,
            defaultValue: "Кадр меньше {{w}}×{{h}} — на экране ничего не разобрать",
          }),
        );
        return;
      }
      setФайл(f);
      setМета(м);
      if (!название) setНазвание(f.name.replace(/\.[^.]+$/, ""));
    } catch {
      setБеда(
        t("videra.upload.unreadable", {
          defaultValue: "Не удалось прочитать файл — возможно, он повреждён",
        }),
      );
    }
  };

  const отправить = async () => {
    if (!файл || !мета || !название.trim()) return;
    setБеда("");
    setПрогресс(0);
    try {
      const заявка = await prepareUpload({
        title: название.trim(),
        description: описание.trim(),
        mime: файл.type,
        sizeBytes: файл.size,
        durationSec: мета.durationSec,
        categoryId: раздел || undefined,
        // Версия правил идёт вместе с согласием: без неё «принял правила»
        // не говорит, какие именно.
        termsAccepted: true,
        termsVersion: правила?.version || "",
      });

      try {
        await залить(заявка.uploadUrl, файл, файл.type, setПрогресс);
        // Превью не критично: ролик без картинки лучше, чем сорванная
        // загрузка из-за неё.
        if (мета.poster) {
          await залить(заявка.posterUrl, мета.poster, "image/jpeg").catch(() => {});
        }
        await completeUpload(заявка.videoId);
      } catch (прямая) {
        // ХРАНИЛИЩЕ НЕ ПРИНЯЛО ФАЙЛ ИЗ БРАУЗЕРА — ИДЁМ ЧЕРЕЗ СЕРВЕР.
        //
        // Обычная причина — бакет не разрешает запись с нашего домена, и
        // тогда браузер даже не доходит до отправки. Человеку об этом
        // знать незачем: он выбрал файл и ждёт результата.
        console.warn("[upload] прямой путь не вышел:", прямая?.message);
        setПрогресс(0);

        await directUpload(
          {
            file: файл,
            poster: мета.poster,
            title: название.trim(),
            description: описание.trim(),
            durationSec: мета.durationSec,
            categoryId: раздел || undefined,
            rulesVersion: правила?.version || "",
          },
          setПрогресс,
        );
      }
      setПрогресс(null);
      setФайл(null);
      setМета(null);
      setНазвание("");
      setОписание("");
      if (поле.current) поле.current.value = "";
      onDone?.();
    } catch (e) {
      setПрогресс(null);
      setБеда(
        e?.response?.data?.message ||
          t("videra.upload.failed", { defaultValue: "Загрузка не удалась" }),
      );
    }
  };

  return (
    <div style={стиль.блок}>
      <div style={стиль.заголовок}>
        {t("videra.upload.title", { defaultValue: "Загрузить своё видео" })}
      </div>
      {/* Требования показываем до выбора файла: узнать о них после того,
          как человек десять минут ждал загрузку, — худший из возможных
          моментов. */}
      <ul style={стиль.правила}>
        <li>
          {t("videra.upload.reqFormat", {
            defaultValue: "MP4 (H.264), WebM (VP9) или MOV — то, что играет в браузере",
          })}
        </li>
        <li>
          {t("videra.upload.reqLength", {
            min: Math.round(МАКС_СЕКУНД / 60),
            defaultValue: "не длиннее {{min}} минут",
          })}
        </li>
        <li>
          {t("videra.upload.reqSize", {
            mb: Math.round(МАКС_БАЙТ / 1024 / 1024),
            defaultValue: "не тяжелее {{mb}} МБ",
          })}
        </li>
        <li>
          {t("videra.upload.reqResolution", {
            w: МАКС_ШИРИНА,
            h: МАКС_ВЫСОТА,
            defaultValue: "кадр до {{w}}×{{h}}, звук по желанию",
          })}
        </li>
      </ul>

      <input
        ref={поле}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={выбрать}
        disabled={прогресс !== null}
        style={стиль.файл}
      />

      {мета && (
        <>
          <input
            value={название}
            onChange={(e) => setНазвание(e.target.value)}
            placeholder={t("videra.upload.name", { defaultValue: "Название" })}
            style={стиль.поле}
            disabled={прогресс !== null}
          />
          <textarea
            value={описание}
            onChange={(e) => setОписание(e.target.value)}
            placeholder={t("videra.upload.about", { defaultValue: "О чём ролик" })}
            rows={2}
            style={стиль.поле}
            disabled={прогресс !== null}
          />
          <select
            value={раздел}
            onChange={(e) => setРаздел(e.target.value)}
            style={стиль.поле}
            disabled={прогресс !== null}
          >
            <option value="">
              {t("videra.upload.noCategory", { defaultValue: "Без раздела" })}
            </option>
            {разделы.map((к) => (
              <option key={к._id} value={к._id}>
                {к.title}
              </option>
            ))}
          </select>

          <div style={стиль.мета}>
            {t("videra.upload.meta2", {
              sec: мета.durationSec,
              mb: Math.round(файл.size / 1024 / 1024),
              w: мета.width,
              h: мета.height,
              defaultValue: "{{sec}} с · {{mb}} МБ · {{w}}×{{h}}",
            })}
          </div>
        </>
      )}

      {/* Правила и согласие. Без галочки кнопка не работает, и сервер
          откажет тоже — проверка стоит в обоих местах не ради надёжности
          интерфейса, а потому что согласие хранится вместе с роликом. */}
      {правила && (
        <div style={стиль.правилаБлок}>
          <button
            type="button"
            onClick={() => setПравилаРаскрыты((v) => !v)}
            style={стиль.кнопкаПравил}
          >
            {правилаРаскрыты
              ? t("videra.rules.hide", { defaultValue: "Свернуть правила" })
              : t("videra.rules.show", { defaultValue: "Правила публикации" })}
          </button>

          {правилаРаскрыты && (
            <div style={стиль.правилаТекст}>
              <div style={стиль.правилаЗаголовок}>
                {t("videra.rules.topics", { defaultValue: "Что можно публиковать" })}
              </div>
              <ul style={стиль.правилаСписок}>
                {(правила.topics || []).map((к) => (
                  <li key={к}>{t(`videra.rules.topic.${к}`, { defaultValue: к })}</li>
                ))}
              </ul>

              <div style={стиль.правилаЗаголовок}>
                {t("videra.rules.forbidden", { defaultValue: "Что запрещено" })}
              </div>
              <ul style={стиль.правилаСписок}>
                {(правила.forbidden || []).map((к) => (
                  <li key={к}>{t(`videra.rules.no.${к}`, { defaultValue: к })}</li>
                ))}
              </ul>

              <div style={стиль.правилаЗаголовок}>
                {t("videra.rules.requirements", { defaultValue: "Требования к ролику" })}
              </div>
              <ul style={стиль.правилаСписок}>
                {(правила.requirements || []).map((к) => (
                  <li key={к}>{t(`videra.rules.req.${к}`, { defaultValue: к })}</li>
                ))}
              </ul>

              <div style={стиль.правилаЗаголовок}>
                {t("videra.rules.liability", { defaultValue: "Ответственность" })}
              </div>
              <ul style={стиль.правилаСписок}>
                {(правила.liability || []).map((к) => (
                  <li key={к}>{t(`videra.rules.lia.${к}`, { defaultValue: к })}</li>
                ))}
              </ul>
            </div>
          )}

          <label style={стиль.согласие}>
            <input
              type="checkbox"
              checked={согласен}
              onChange={(e) => setСогласен(e.target.checked)}
              disabled={прогресс !== null}
            />
            <span>
              {t("videra.rules.accept", {
                defaultValue:
                  "Я прочитал правила и подтверждаю: у меня есть права на этот материал, в кадре нет пациента без его согласия, и я отвечаю за содержание ролика.",
              })}
            </span>
          </label>
        </div>
      )}

      {прогресс !== null && (
        <div style={стиль.полоса}>
          <div style={{ ...стиль.заполнение, width: `${прогресс}%` }} />
          <span style={стиль.процент}>{прогресс}%</span>
        </div>
      )}

      {беда && (
        <div role="alert" style={стиль.ошибка}>
          {беда}
        </div>
      )}

      <button
        type="button"
        onClick={отправить}
        disabled={!файл || !название.trim() || !согласен || прогресс !== null}
        style={стиль.кнопка}
      >
        {прогресс !== null
          ? t("videra.upload.sending", { defaultValue: "Загружаем…" })
          : t("videra.upload.send", { defaultValue: "Загрузить" })}
      </button>
    </div>
  );
}

const стиль = {
  блок: {
    border: "1px dashed #d6dddb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  заголовок: { fontWeight: 700, fontSize: 15 },
  правила: {
    fontSize: 12,
    color: "#6b7b78",
    margin: 0,
    paddingLeft: 18,
    lineHeight: 1.7,
  },
  файл: { fontSize: 13 },
  поле: {
    border: "1px solid #d6dddb",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
    font: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },
  мета: { fontSize: 12, color: "#6b7b78" },
  правилаБлок: {
    border: "1px solid #e4e9e8",
    borderRadius: 10,
    padding: 12,
    background: "#f8faf9",
  },
  кнопкаПравил: {
    border: "none",
    background: "none",
    color: "#0e8478",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    font: "inherit",
  },
  правилаТекст: { marginTop: 8, fontSize: 12.5, color: "#3b4b49", lineHeight: 1.6 },
  правилаЗаголовок: { fontWeight: 700, marginTop: 8 },
  правилаСписок: { margin: "4px 0 0", paddingLeft: 18 },
  согласие: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 1.5,
    color: "#3b4b49",
    cursor: "pointer",
  },
  полоса: {
    position: "relative",
    height: 20,
    borderRadius: 10,
    background: "#e4e9e8",
    overflow: "hidden",
  },
  заполнение: { height: "100%", background: "#0e8478", transition: "width .2s" },
  процент: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#0f1a19",
  },
  кнопка: {
    alignSelf: "flex-start",
    border: "1px solid #0e8478",
    background: "#0e8478",
    color: "#fff",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  ошибка: {
    padding: 10,
    borderRadius: 8,
    background: "rgba(163,44,34,.08)",
    color: "#a32c22",
    fontSize: 13,
  },
};
