// src/pages/simulation/breast/breastExportUtils.js
//
// Phase B (after warp) — Утилиты для экспорта Before/After изображений.
//
// Все функции возвращают Blob или triggers download.
// PDF использует jsPDF (если установлена) или fallback в композит PNG.

/* ──────────────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────────────── */

function imageDataToCanvas(imageData) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function canvasToBlob(canvas, mime = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Canvas toBlob failed"));
        else resolve(blob);
      },
      mime,
      quality,
    );
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(label, suffix = "") {
  const safe = String(label || "plan")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 80);
  const date = new Date().toISOString().split("T")[0];
  return `${safe}_${date}${suffix}`;
}

/* ──────────────────────────────────────────────────────────────────────
   Single image PNG/JPEG
   ────────────────────────────────────────────────────────────────────── */

export async function exportSingleImage({
  imageData,
  format = "png",
  filename,
  quality = 0.92,
}) {
  if (!imageData) throw new Error("No image data to export");
  const canvas = imageDataToCanvas(imageData);
  const mime =
    format === "jpeg" || format === "jpg" ? "image/jpeg" : "image/png";
  const ext = mime === "image/jpeg" ? "jpg" : "png";
  const blob = await canvasToBlob(canvas, mime, quality);
  downloadBlob(blob, `${filename}.${ext}`);
}

/* ──────────────────────────────────────────────────────────────────────
   Side-by-side composite (Before | After) с подписями
   ────────────────────────────────────────────────────────────────────── */

export async function exportSideBySide({
  beforeImageData,
  afterImageData,
  format = "png",
  filename,
  label = "",
  patientRef = "",
  quality = 0.92,
}) {
  if (!beforeImageData || !afterImageData) {
    throw new Error("Both before and after images required");
  }

  const w = beforeImageData.width;
  const h = beforeImageData.height;
  const gap = Math.round(w * 0.02);
  const titleHeight = Math.round(Math.max(40, h * 0.05));
  const footerHeight = label || patientRef ? Math.round(h * 0.04) : 0;

  const totalW = w * 2 + gap;
  const totalH = h + titleHeight + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalW, totalH);

  // Title labels
  ctx.fillStyle = "#1a1d1f";
  ctx.font = `600 ${Math.round(titleHeight * 0.45)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ДО", w / 2, titleHeight / 2);
  ctx.fillText("ПОСЛЕ", w + gap + w / 2, titleHeight / 2);

  // Images
  const beforeCanvas = imageDataToCanvas(beforeImageData);
  const afterCanvas = imageDataToCanvas(afterImageData);
  ctx.drawImage(beforeCanvas, 0, titleHeight, w, h);
  ctx.drawImage(afterCanvas, w + gap, titleHeight, w, h);

  // Footer
  if (footerHeight > 0) {
    ctx.fillStyle = "#666666";
    ctx.font = `400 ${Math.round(footerHeight * 0.5)}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const footerY = titleHeight + h + footerHeight / 2;
    const footerText = [label, patientRef].filter(Boolean).join(" · ");
    ctx.fillText(footerText, gap, footerY);

    const dateStr = new Date().toLocaleDateString("ru-RU");
    ctx.textAlign = "right";
    ctx.fillText(dateStr, totalW - gap, footerY);
  }

  const mime =
    format === "jpeg" || format === "jpg" ? "image/jpeg" : "image/png";
  const ext = mime === "image/jpeg" ? "jpg" : "png";
  const blob = await canvasToBlob(canvas, mime, quality);
  downloadBlob(blob, `${filename}.${ext}`);
}

/* ──────────────────────────────────────────────────────────────────────
   PDF — две страницы (Before / After) + cover.
   Использует jsPDF если установлен, иначе — fallback через window.print.
   ────────────────────────────────────────────────────────────────────── */

export async function exportPDF({
  beforeImageData,
  afterImageData,
  filename,
  label = "",
  patientRef = "",
  photoView = "front",
}) {
  if (!beforeImageData || !afterImageData) {
    throw new Error("Both before and after images required");
  }

  // Динамический импорт jsPDF — не падаем если не установлен
  let jsPDF;
  try {
    const mod = await import("jspdf");
    jsPDF = mod.jsPDF || mod.default;
  } catch (err) {
    console.warn("[exportPDF] jsPDF not installed, falling back to print", err);
    return exportPDFViaPrint({
      beforeImageData,
      afterImageData,
      label,
      patientRef,
      photoView,
    });
  }

  const beforeCanvas = imageDataToCanvas(beforeImageData);
  const afterCanvas = imageDataToCanvas(afterImageData);
  const beforeDataUrl = beforeCanvas.toDataURL("image/jpeg", 0.92);
  const afterDataUrl = afterCanvas.toDataURL("image/jpeg", 0.92);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const contentW = pageW - margin * 2;

  const aspect = beforeImageData.width / beforeImageData.height;

  /* ─── Title page / Side-by-side ─── */
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("План моделирования", pageW / 2, margin + 8, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  let metaY = margin + 16;
  if (label) {
    doc.text(`Название: ${label}`, margin, metaY);
    metaY += 6;
  }
  if (patientRef) {
    doc.text(`Пациент: ${patientRef}`, margin, metaY);
    metaY += 6;
  }
  doc.text(`Ракурс: ${photoView}`, margin, metaY);
  metaY += 6;
  doc.text(`Дата: ${new Date().toLocaleDateString("ru-RU")}`, margin, metaY);
  metaY += 10;

  // Two images side by side
  const imgW = (contentW - 4) / 2;
  const imgH = imgW / aspect;
  const imagesY = metaY + 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ДО", margin + imgW / 2, imagesY - 2, { align: "center" });
  doc.text("ПОСЛЕ", margin + imgW + 4 + imgW / 2, imagesY - 2, {
    align: "center",
  });

  doc.addImage(beforeDataUrl, "JPEG", margin, imagesY, imgW, imgH);
  doc.addImage(afterDataUrl, "JPEG", margin + imgW + 4, imagesY, imgW, imgH);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Сгенерировано DocPats · docpats.com", pageW / 2, pageH - margin, {
    align: "center",
  });

  /* ─── Page 2 — Before full size ─── */
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("ДО", pageW / 2, margin + 6, { align: "center" });
  const fullImgH = Math.min(pageH - margin * 2 - 14, contentW / aspect);
  const fullImgW = fullImgH * aspect;
  const fullImgX = (pageW - fullImgW) / 2;
  doc.addImage(
    beforeDataUrl,
    "JPEG",
    fullImgX,
    margin + 12,
    fullImgW,
    fullImgH,
  );

  /* ─── Page 3 — After full size ─── */
  doc.addPage();
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ПОСЛЕ", pageW / 2, margin + 6, { align: "center" });
  doc.addImage(afterDataUrl, "JPEG", fullImgX, margin + 12, fullImgW, fullImgH);

  doc.save(`${filename}.pdf`);
}

/* ──────────────────────────────────────────────────────────────────────
   Fallback PDF via window.print — если jsPDF не установлен.
   Открывает новое окно с HTML и вызывает print dialog.
   ────────────────────────────────────────────────────────────────────── */
function exportPDFViaPrint({
  beforeImageData,
  afterImageData,
  label,
  patientRef,
  photoView,
}) {
  const beforeCanvas = imageDataToCanvas(beforeImageData);
  const afterCanvas = imageDataToCanvas(afterImageData);
  const beforeDataUrl = beforeCanvas.toDataURL("image/jpeg", 0.92);
  const afterDataUrl = afterCanvas.toDataURL("image/jpeg", 0.92);

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>План моделирования</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #1a1d1f; }
    h1 { font-size: 22px; margin-bottom: 12px; text-align: center; }
    .meta { font-size: 12px; color: #666; margin-bottom: 20px; line-height: 1.7; }
    .meta div { display: flex; gap: 8px; }
    .meta b { color: #1a1d1f; min-width: 90px; }
    .images { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .img-block { text-align: center; }
    .img-label { font-size: 13px; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.05em; }
    img { width: 100%; border: 1px solid #e5e7eb; border-radius: 4px; }
    .footer { font-size: 10px; color: #999; text-align: center; margin-top: 30px; padding-top: 12px; border-top: 1px solid #eee; }
    @media print {
      body { padding: 12mm; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <h1>План моделирования</h1>
  <div class="meta">
    ${label ? `<div><b>Название:</b> ${label}</div>` : ""}
    ${patientRef ? `<div><b>Пациент:</b> ${patientRef}</div>` : ""}
    <div><b>Ракурс:</b> ${photoView}</div>
    <div><b>Дата:</b> ${new Date().toLocaleDateString("ru-RU")}</div>
  </div>
  <div class="images">
    <div class="img-block">
      <div class="img-label">ДО</div>
      <img src="${beforeDataUrl}" alt="Before">
    </div>
    <div class="img-block">
      <div class="img-label">ПОСЛЕ</div>
      <img src="${afterDataUrl}" alt="After">
    </div>
  </div>
  <div class="footer">Сгенерировано DocPats · docpats.com</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert(
      "Не удалось открыть окно печати. Разрешите всплывающие окна для DocPats.",
    );
    return;
  }
  win.document.write(html);
  win.document.close();
}

/* ──────────────────────────────────────────────────────────────────────
   PUBLIC — main API.
   ────────────────────────────────────────────────────────────────────── */

export async function exportBeforeAfter(format, opts) {
  const filename = safeFilename(opts.label || "plan", `_${format}`);

  switch (format) {
    case "before-png":
      return exportSingleImage({
        imageData: opts.beforeImageData,
        format: "png",
        filename: safeFilename(opts.label, "_before"),
      });

    case "after-png":
      return exportSingleImage({
        imageData: opts.afterImageData,
        format: "png",
        filename: safeFilename(opts.label, "_after"),
      });

    case "side-by-side-png":
      return exportSideBySide({
        ...opts,
        format: "png",
        filename: safeFilename(opts.label, "_compare"),
      });

    case "side-by-side-jpg":
      return exportSideBySide({
        ...opts,
        format: "jpeg",
        quality: 0.85,
        filename: safeFilename(opts.label, "_compare"),
      });

    case "pdf":
      return exportPDF({
        ...opts,
        filename: safeFilename(opts.label, "_report"),
      });

    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}
