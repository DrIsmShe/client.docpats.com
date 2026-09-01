import React from "react";
import { useTranslation } from "react-i18next";

export default function FooterAI() {
  const { t } = useTranslation("NewsAiTranslate");
  return (
    /*
     * Ширина и отступы — те же, что у блока источника выше
     * (.dp-footer-inner в pages/newsAI/NewsArticle.jsx): 780 пикселей и
     * 40 по бокам. Раньше этот блок шёл во всю ширину окна, а статья
     * была сжата — строки редакции разъезжались шире текста, и подвал
     * выглядел рыхлым.
     *
     * Отступа сверху тоже больше нет: два блока одного цвета, разделённые
     * пустотой, читались как обрыв вёрстки. Теперь их разделяет тонкая
     * линия, и подвал читается как одна область.
     */
    <div
      style={{
        margin: 0,
        padding: "28px 0 32px",
        background: "var(--paper2)",
        borderTop: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
      }}
    >
      <div
        style={{
          maxWidth: 780,
          margin: "0 auto",
          padding: "0 40px",
          boxSizing: "border-box",
        }}
      >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: 10,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 14,
        }}
      >
        {t("footer.about")}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            flexShrink: 0,
            background: "#b83030",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--serif)",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          И
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            {t("footer.name")}
          </div>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--muted)",
              letterSpacing: ".06em",
            }}
          >
            {t("footer.role")}
          </div>
        </div>
      </div>

      <p
        style={{
          fontFamily: "var(--sans)",
          fontSize: 14,
          fontWeight: 300,
          lineHeight: 1.75,
          color: "var(--ink2)",
          margin: "0 0 12px",
        }}
      >
        {t("footer.description")}
      </p>

      {/* Оговорки про оригинальную публикацию здесь БОЛЬШЕ НЕТ.
          Этот подвал стоит и на списке статей, и на собственных
          материалах DocPats, где никакой оригинальной публикации не
          существует — фраза «посетите оригинальную публикацию» там была
          просто неверной. А на странице новости она вдобавок дублировала
          такую же строку у кнопки «Читать оригинал».
          Теперь оговорка живёт в одном месте: рядом с этой кнопкой
          (pages/newsAI/NewsArticle.jsx), где ей и место. */}
      </div>
    </div>
  );
}
