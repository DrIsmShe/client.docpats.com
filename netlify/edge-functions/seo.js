export default async function handler(request, context) {
  const url = new URL(request.url);

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

export const config = {
  path: [
    "/articles/*",
    "/news/*",
    "/public/doctor-profile/article-detail-for-all/*",
    "/public/doctor/article-scientific-detail-for-all/*",
    "/public/doctor-profile/doctor-details/*",
  ],
};
