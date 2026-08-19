// ─────────────────────────────────────────────────────────────────────
//   Печать/выгрузка карточки исследования в PDF.
//
//   Эти два действия («Скачать PDF» / «Отправить PDF») были скопированы в 19
//   страниц поликлиники, и во всех копиях жили одни и те же три бага:
//
//     1) файл уходил в поле `file`, а сервер принимает `upload.single("pdf")`
//        — multer отбивал запрос с "Unexpected field", отправка не работала
//        НИ на одной странице;
//     2) ответ читали как `response.data.fileUrl`, хотя роут отдаёт `{ url }`
//        — в «успешном» alert печаталось undefined;
//     3) высокая карточка клалась в PDF одной картинкой на одну страницу A4,
//        и всё, что ниже 277 мм, просто обрезалось.
//
//   Поэтому логика живёт здесь одна на всех, а страницы только называют
//   элемент и имя файла.
// ─────────────────────────────────────────────────────────────────────

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import api from "../axios";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 10;

/**
 * Имя файла из диагноза/типа исследования: текст вводит врач, а слэши и
 * двоеточия ломают и сохранение в браузере, и ключ объекта в хранилище.
 */
export function pdfFileName(base, fallback = "medical_history") {
  const clean = String(base ?? "")
    .replace(/[\\/:*?"<>|\r\n\t]+/g, "_")
    .trim()
    .slice(0, 80);
  return `${clean || fallback}.pdf`;
}

/**
 * Рендерит элемент по id в многостраничный A4-документ.
 * @returns {Promise<jsPDF>}
 */
export async function buildPdfFromElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`PDF target #${elementId} not found`);

  const canvas = await html2canvas(element, {
    useCORS: true,
    // allowTaint здесь намеренно выключен: одна картинка без CORS-заголовков
    // «пачкает» canvas, и toDataURL() падает целиком. Потерять картинку
    // лучше, чем потерять весь документ.
    allowTaint: false,
    backgroundColor: "#ffffff",
    scale: 2,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = A4_WIDTH_MM - MARGIN_MM * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pageBody = A4_HEIGHT_MM - MARGIN_MM * 2;

  // Одну и ту же картинку кладём на каждую страницу со сдвигом вверх —
  // видимой остаётся своя полоса. Иначе выписка длиннее одной A4 обрезается.
  let heightLeft = imgHeight;
  let position = MARGIN_MM;
  pdf.addImage(imgData, "PNG", MARGIN_MM, position, imgWidth, imgHeight);
  heightLeft -= pageBody;

  while (heightLeft > 0) {
    position = MARGIN_MM + heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", MARGIN_MM, position, imgWidth, imgHeight);
    heightLeft -= pageBody;
  }

  return pdf;
}

/** Скачивание в браузер. */
export async function savePdfFromElement(elementId, baseName, fallback) {
  const pdf = await buildPdfFromElement(elementId);
  pdf.save(pdfFileName(baseName, fallback));
}

/**
 * Отправка в хранилище. Возвращает публичный URL загруженного файла.
 *
 * Поле формы — строго "pdf" (см. server/common/routes/uploadFileRoutes.js),
 * Content-Type не задаём руками: без boundary multer не разберёт тело.
 */
export async function uploadPdfFromElement(elementId, baseName, fallback) {
  const pdf = await buildPdfFromElement(elementId);
  const fileName = pdfFileName(baseName, fallback);
  const file = new File([pdf.output("blob")], fileName, {
    type: "application/pdf",
  });

  const formData = new FormData();
  formData.append("pdf", file);

  const { data } = await api.post("/api/upload", formData);
  return data?.url;
}
