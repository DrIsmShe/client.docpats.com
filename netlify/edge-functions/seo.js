export default async function handler(request, context) {
  const url = new URL(request.url);

  // ── Главная страница: свои title/description/OG + WebSite JSON-LD ──
  // SPA-шелл иначе отдаёт боту только статичный <title> без структурных данных.
  if (url.pathname === "/") {
    try {
      const title =
        "DocPats — медицинская платформа для врачей, пациентов и клиник";
      const desc =
        "DocPats — платформа с приоритетом на приватность данных: профили врачей и пациентов, AI-консультации, защищённый чат и видеозвонки, управление клиникой. 5 языков.";
      const pageUrl = "https://docpats.com/";
      const image = "https://docpats.com/og-default.jpg";

      const response = await context.next();
      let html = await response.text();
      html = html
        .replace(/<title>.*?<\/title>/gs, "")
        .replace(/<meta name="description"[^>]*\/?>/gi, "");

      const inject = `
    <title>${title}</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${image}">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "DocPats",
      url: pageUrl,
      description: desc,
      inLanguage: "ru",
      publisher: {
        "@type": "Organization",
        name: "DocPats",
        url: "https://docpats.com",
      },
    })}</script>`;

      html = html.replace("</head>", inject + "</head>");
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {
      return context.next();
    }
  }

  // ── Раздел документации: /docs/<раздел> ──
  const docsMatch = url.pathname.match(/^\/docs\/([a-z0-9-]+)\/?$/);
  if (docsMatch) {
    try {
      const section = docsMatch[1];

      // Русский — язык оригинала корпуса. Все языки живут по одному адресу,
      // поэтому в индекс попадает одна версия; отдельные адреса на язык и
      // hreflang — следующий шаг, если раздел начнёт приводить трафик.
      const mdRes = await fetch(`${url.origin}/docs/${section}/ru.md`);
      if (!mdRes.ok) return context.next();

      const md = await mdRes.text();
      // Netlify отдаёт index.html со статусом 200 на несуществующий путь,
      // поэтому ok здесь ничего не доказывает.
      if (md.trimStart().startsWith("<")) return context.next();

      const heading = titleFromMarkdown(md);
      const desc = descriptionFromMarkdown(md);
      if (!heading || !desc) return context.next();

      const title = `${heading} — DocPats`;
      const pageUrl = `https://docpats.com/docs/${section}`;
      const image = "https://docpats.com/og-default.jpg";

      const response = await context.next();
      let html = await response.text();
      html = html
        .replace(/<title>.*?<\/title>/gs, "")
        .replace(/<meta name="description"[^>]*\/?>/gi, "");

      const inject = `
    <title>${escAttr(title)}</title>
    <meta name="description" content="${escAttr(desc)}">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escAttr(title)}">
    <meta property="og:description" content="${escAttr(desc)}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${image}">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: heading,
      description: desc,
      url: pageUrl,
      inLanguage: "ru",
      isPartOf: {
        "@type": "WebSite",
        name: "DocPats",
        url: "https://docpats.com",
      },
      publisher: {
        "@type": "Organization",
        name: "DocPats",
        url: "https://docpats.com",
      },
    })}</script>`;

      html = html.replace("</head>", inject + "</head>");
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {
      return context.next();
    }
  }

  const articleMatch = url.pathname.match(
    /^\/articles\/([a-f0-9]{24})(?:\/([a-z]{2}))?$/,
  );
  const newsMatch = url.pathname.match(/^\/news\/([^/]+)$/);
  const doctorArticleMatch = url.pathname.match(
    /^\/public\/doctor-profile\/article-detail-for-all\/([a-f0-9]{24})$/,
  );
  const scientificArticleMatch = url.pathname.match(
    /^\/public\/doctor\/article-scientific-detail-for-all\/([a-f0-9]{24})$/,
  );
  const doctorProfileMatch = url.pathname.match(
    /^\/public\/doctor-profile\/doctor-details\/([a-f0-9]{24})$/,
  );

  if (
    !articleMatch &&
    !newsMatch &&
    !doctorArticleMatch &&
    !scientificArticleMatch &&
    !doctorProfileMatch
  ) {
    return context.next();
  }

  try {
    let title, desc, pageUrl, publishedAt, imageUrl, locale, schemaType;
    let aggregateRating; // для врача — звёзды в выдаче Google

    if (articleMatch) {
      const articleId = articleMatch[1];
      const urlLocale = articleMatch[2];
      const cookieHeader = request.headers.get("cookie") || "";
      const cookieLocale = cookieHeader.match(/locale=([a-z]{2})/)?.[1];
      locale = urlLocale || cookieLocale || "ru";
      schemaType = "MedicalWebPage";

      const res = await fetch(
        `https://news-api.docpats.com/api/synthesis/${articleId}`,
      );
      if (!res.ok) return context.next();
      const data = await res.json();
      const article = data?.article;
      if (!article) return context.next();

      const seo = article.seo?.[locale] || article.seo?.ru || {};
      title = (seo.title || article.title || "")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, " ")
        .trim();
      desc = (
        seo.description ||
        (article.body || "")
          .replace(/#+\s/g, "")
          .replace(/\n/g, " ")
          .trim()
          .slice(0, 155)
      ).replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/articles/${articleId}${urlLocale ? "/" + urlLocale : ""}`;
      publishedAt = article.createdAt;
      imageUrl = "https://docpats.com/og-default.jpg";
    } else if (newsMatch) {
      const slug = newsMatch[1];
      const cookieHeader = request.headers.get("cookie") || "";
      const cookieLocale = cookieHeader.match(/locale=([a-z]{2})/)?.[1];
      const urlLocale = url.searchParams.get("locale");
      locale = urlLocale || cookieLocale || "en";
      schemaType = "NewsArticle";

      const res = await fetch(
        `https://news-api.docpats.com/api/news/${slug}?locale=${locale}`,
      );
      if (!res.ok) return context.next();
      const data = await res.json();
      const article = data?.data;
      if (!article) return context.next();

      title = (article.title || "").replace(/"/g, "&quot;");
      desc = (article.aiSummaryShort || article.summary || "")
        .slice(0, 155)
        .replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/news/${slug}${urlLocale ? "?locale=" + urlLocale : ""}`;
      publishedAt = article.publishedAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-default.jpg";
    } else if (doctorArticleMatch) {
      const articleId = doctorArticleMatch[1];
      locale = "ru";
      schemaType = "MedicalScholarlyArticle";

      const res = await fetch(
        `https://backend.docpats.com/doctor-profile/my-article-single/${articleId}`,
      );
      if (!res.ok) return context.next();
      const data = await res.json();
      const article = data?.data;
      if (!article) return context.next();

      title = (article.title || "").replace(/"/g, "&quot;");
      desc = (article.metaDescription || article.abstract || "")
        .slice(0, 155)
        .replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/public/doctor-profile/article-detail-for-all/${articleId}`;
      publishedAt = article.createdAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-default.jpg";
    } else if (scientificArticleMatch) {
      const articleId = scientificArticleMatch[1];
      locale = "ru";
      schemaType = "ScholarlyArticle";

      const res = await fetch(
        `https://backend.docpats.com/doctor-profile/my-article-scientific-single/${articleId}`,
      );
      if (!res.ok) return context.next();
      const data = await res.json();
      const article = data?.data;
      if (!article) return context.next();

      title = (article.title || "").replace(/"/g, "&quot;");
      desc = (article.metaDescription || article.abstract || "")
        .slice(0, 155)
        .replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/public/doctor/article-scientific-detail-for-all/${articleId}`;
      publishedAt = article.createdAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-default.jpg";
    } else if (doctorProfileMatch) {
      const doctorId = doctorProfileMatch[1];
      locale = "ru";
      schemaType = "Physician";

      const res = await fetch(
        `https://backend.docpats.com/doctor-profile/doctor-detail/${doctorId}`,
      );
      if (!res.ok) return context.next();
      const data = await res.json();
      const doctor = data;
      if (!doctor) return context.next();

      const firstName = doctor.user?.firstName || "";
      const lastName = doctor.user?.lastName || "";
      const fullName = `Dr. ${firstName} ${lastName}`.trim();
      const specName =
        doctor.user?.specializationName ||
        doctor.user?.specialization?.name ||
        "";

      title = `${fullName} — ${specName} | DocPats`.replace(/"/g, "&quot;");
      desc = (
        doctor.about || `Профиль врача ${fullName}, специальность: ${specName}`
      )
        .slice(0, 155)
        .replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/public/doctor-profile/doctor-details/${doctorId}`;
      publishedAt = null;
      imageUrl = doctor.profileImage || "https://docpats.com/og-default.jpg";

      // Агрегированный рейтинг — для rich snippet со звёздами в Google.
      try {
        const statsRes = await fetch(
          `https://backend.docpats.com/doctor-profile/stats/${doctorId}`,
        );
        if (statsRes.ok) {
          const stats = await statsRes.json();
          if (stats?.success && stats.reviewCount > 0 && stats.averageRating > 0) {
            aggregateRating = {
              "@type": "AggregateRating",
              ratingValue: stats.averageRating,
              reviewCount: stats.reviewCount,
              bestRating: 5,
              worstRating: 1,
            };
          }
        }
      } catch {
        /* без рейтинга — ок */
      }
    }

    const response = await context.next();
    let html = await response.text();

    html = html
      .replace(/<title>.*?<\/title>/gs, "")
      .replace(/<meta name="description"[^>]*\/?>/gi, "")
      .replace(/<meta property="og:title"[^>]*\/?>/gi, "")
      .replace(/<meta property="og:description"[^>]*\/?>/gi, "")
      .replace(/<meta property="og:type"[^>]*\/?>/gi, "")
      .replace(/<meta property="og:url"[^>]*\/?>/gi, "")
      .replace(/<meta property="og:image"[^>]*\/?>/gi, "")
      .replace(/<meta property="og:locale"[^>]*\/?>/gi, "")
      .replace(/<meta name="twitter:card"[^>]*\/?>/gi, "")
      .replace(/<meta name="twitter:title"[^>]*\/?>/gi, "")
      .replace(/<meta name="twitter:description"[^>]*\/?>/gi, "")
      .replace(/<meta name="twitter:image"[^>]*\/?>/gi, "")
      .replace(/<link rel="canonical"[^>]*\/?>/gi, "")
      .replace(/<link rel="alternate"[^>]*\/?>/gi, "");

    const inject = `
    <title>${title} | DocPats</title>
    <meta name="description" content="${desc}">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:type" content="${schemaType === "Physician" ? "profile" : "article"}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:locale" content="${locale}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${imageUrl}">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": schemaType,
      headline: schemaType !== "Physician" ? title : undefined,
      name: schemaType === "Physician" ? title : undefined,
      description: desc,
      url: pageUrl,
      inLanguage: locale,
      datePublished: publishedAt || undefined,
      image: imageUrl,
      aggregateRating:
        schemaType === "Physician" ? aggregateRating : undefined,
      publisher:
        schemaType !== "Physician"
          ? {
              "@type": "Organization",
              name: "DocPats",
              url: "https://docpats.com",
            }
          : undefined,
    })}</script>`;

    html = html.replace("</head>", inject + "</head>");

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return context.next();
  }
}

/* ── Документация: /docs/<раздел> ─────────────────────────────────────
 *
 * Тексты корпуса лежат статикой (public/docs/<раздел>/<язык>.md) и рендерятся
 * на клиенте, поэтому боту без этой ветки достаётся пустой SPA-шелл. А это
 * ровно те страницы, которые должны приводить людей из поиска: «почему врачу
 * стоит работать здесь» и то же самое для пациента. Страница, которая не
 * индексируется, работает только по прямой ссылке — то есть не работает.
 *
 * Заголовок и описание берутся из самого markdown, а не задаются здесь
 * списком: иначе правка текста и правка мета-тегов разъезжаются, и в выдаче
 * годами висит описание раздела, которого уже нет.
 */

/** Экранирование для подстановки в атрибут HTML. */
function escAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Первый заголовок первого уровня. */
function titleFromMarkdown(md) {
  const line = md.split("\n").find((l) => l.startsWith("# "));
  return line ? line.slice(2).trim() : null;
}

/**
 * Первый содержательный абзац как описание. Пропускаем заголовки, списки,
 * разделители и цитаты — из них получается описание вида «— **Видеоприём**».
 *
 * Нумерованные строки отсеиваются отдельно: в руководствах сразу за
 * заголовком идёт оглавление, и без этого в описание уезжало «1. Что такое…
 * 2. Рабочий процесс… 3. Создание нового плана».
 */
function descriptionFromMarkdown(md, limit = 160) {
  const paragraph = md
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .find((p) => p && !/^(\d+[.)]\s|[#>\-*|])/.test(p) && !/^---/.test(p));
  if (!paragraph) return null;

  const plain = paragraph
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= limit) return plain;
  const cut = plain.slice(0, limit - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).trim() + "…";
}

export const config = {
  path: [
    "/",
    "/docs/*",
    "/articles/*",
    "/news/*",
    "/public/doctor-profile/article-detail-for-all/*",
    "/public/doctor/article-scientific-detail-for-all/*",
    "/public/doctor-profile/doctor-details/*",
  ],
};
