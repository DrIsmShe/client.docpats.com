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
      const image = "https://docpats.com/og-image.jpg";

      const response = await context.next();
      let html = await response.text();
      html = stripShellSeo(html);

      const inject = `
    <title>${title}</title>
    <meta name="description" content="${desc}" data-seo="edge">
    <link rel="canonical" href="${pageUrl}" data-seo="edge">
    <meta data-seo="edge" property="og:type" content="website">
    <meta data-seo="edge" property="og:title" content="${title}">
    <meta data-seo="edge" property="og:description" content="${desc}">
    <meta data-seo="edge" property="og:url" content="${pageUrl}">
    <meta data-seo="edge" property="og:image" content="${image}">
    <meta data-seo="edge" name="twitter:card" content="summary_large_image">
    <meta data-seo="edge" name="twitter:title" content="${title}">
    <meta data-seo="edge" name="twitter:description" content="${desc}">
    <meta data-seo="edge" name="twitter:image" content="${image}">
    <script type="application/ld+json" data-seo="edge">${JSON.stringify({
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
      const image = "https://docpats.com/og-image.jpg";

      const response = await context.next();
      let html = await response.text();
      html = stripShellSeo(html);

      const inject = `
    <title>${escAttr(title)}</title>
    <meta name="description" content="${escAttr(desc)}" data-seo="edge">
    <link rel="canonical" href="${pageUrl}" data-seo="edge">
    <meta data-seo="edge" property="og:type" content="article">
    <meta data-seo="edge" property="og:title" content="${escAttr(title)}">
    <meta data-seo="edge" property="og:description" content="${escAttr(desc)}">
    <meta data-seo="edge" property="og:url" content="${pageUrl}">
    <meta data-seo="edge" property="og:image" content="${image}">
    <meta data-seo="edge" name="twitter:card" content="summary_large_image">
    <meta data-seo="edge" name="twitter:title" content="${escAttr(title)}">
    <meta data-seo="edge" name="twitter:description" content="${escAttr(desc)}">
    <meta data-seo="edge" name="twitter:image" content="${image}">
    <script type="application/ld+json" data-seo="edge">${JSON.stringify({
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

  // ── Витрина клиники: /clinics/<slug> ──
  //
  // Страница есть в sitemap, но SEO-обработки у неё не было вовсе: бот
  // получал пустой SPA-шелл. А это единственная публичная страница, ради
  // которой клиника вообще заводит витрину.
  //
  // Тип MedicalClinic, а не Organization: для медицинской организации
  // Google понимает адрес, телефон, специализации и рейтинг как единое
  // целое и показывает их в выдаче. Отдельным блоком, а не через общий
  // schemaType ниже: у клиники другой набор полей, и попытка втиснуть её
  // в форму статьи дала бы разметку с headline и datePublished, которых
  // у клиники нет.
  const clinicMatch = url.pathname.match(/^\/clinics\/([a-z0-9-]+)\/?$/i);
  if (clinicMatch) {
    try {
      const slug = clinicMatch[1];
      const res = await fetch(
        `https://backend.docpats.com/api/v1/public/clinics/${encodeURIComponent(slug)}`,
      );
      if (!res.ok) return context.next();
      const clinic = await res.json();
      if (!clinic?.name) return context.next();

      const pageUrl = `https://docpats.com/clinics/${slug}`;
      const title = escAttr(clinic.name);
      const desc = escAttr(
        (clinic.description || clinic.slogan || `Клиника ${clinic.name}`)
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 155),
      );
      const image =
        clinic.coverImage || clinic.logo || "https://docpats.com/og-image.jpg";

      const address = clinic.address || {};
      const hasAddress = address.country || address.city || address.street;

      const rating =
        clinic.rating?.count > 0 && clinic.rating?.avg > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: clinic.rating.avg,
              reviewCount: clinic.rating.count,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined;

      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "MedicalClinic",
        name: clinic.name,
        description: desc,
        url: pageUrl,
        image,
        logo: clinic.logo || undefined,
        telephone: clinic.callCenterPhone || clinic.contacts?.phone || undefined,
        email: clinic.contacts?.email || undefined,
        address: hasAddress
          ? {
              "@type": "PostalAddress",
              addressCountry: address.country || undefined,
              addressLocality: address.city || undefined,
              streetAddress: address.street || undefined,
            }
          : undefined,
        medicalSpecialty: clinic.specializations?.length
          ? clinic.specializations
          : undefined,
        aggregateRating: rating,
        parentOrganization: {
          "@type": "Organization",
          name: "DocPats",
          url: "https://docpats.com",
        },
      };

      const response = await context.next();
      let html = await response.text();
      html = stripShellSeo(html);

      const inject = `
    <title>${title} | DocPats</title>
    <meta name="description" content="${desc}" data-seo="edge">
    <link rel="canonical" href="${pageUrl}" data-seo="edge">
    <meta data-seo="edge" property="og:type" content="business.business">
    <meta data-seo="edge" property="og:title" content="${title}">
    <meta data-seo="edge" property="og:description" content="${desc}">
    <meta data-seo="edge" property="og:url" content="${pageUrl}">
    <meta data-seo="edge" property="og:image" content="${escAttr(image)}">
    <meta data-seo="edge" name="twitter:card" content="summary_large_image">
    <meta data-seo="edge" name="twitter:title" content="${title}">
    <meta data-seo="edge" name="twitter:description" content="${desc}">
    <meta data-seo="edge" name="twitter:image" content="${escAttr(image)}">
    <script type="application/ld+json" data-seo="edge">${JSON.stringify(jsonLd)}</script>`;

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
    // dateModified поисковики учитывают отдельно от datePublished: без него
    // обновлённый материал в выдаче выглядит настолько же старым, как в день
    // публикации. medicalSpecialty — то, по чему врача вообще ищут.
    let modifiedAt, medicalSpecialty;
    // hreflang в сыром HTML — до того, как отработает JS. Helmet ставит те
    // же теги, но уже после рендера; часть роботов до этого не доходит.
    let alternateLinks = "";

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
      modifiedAt = article.updatedAt || article.createdAt;
      imageUrl = "https://docpats.com/og-image.jpg";
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
      // Английская версия живёт на голом адресе; ?locale=en нормализуем в
      // него же, иначе в индекс попадут два адреса с одним содержимым.
      const newsBase = `https://docpats.com/news/${slug}`;
      const localeHref = (c) => (c === "en" ? newsBase : `${newsBase}?locale=${c}`);
      pageUrl = urlLocale ? localeHref(urlLocale) : newsBase;
      alternateLinks = [
        `<link data-seo="edge" rel="alternate" hreflang="x-default" href="${newsBase}">`,
        ...["ru", "en", "az", "tr", "ar"].map(
          (c) => `<link data-seo="edge" rel="alternate" hreflang="${c}" href="${localeHref(c)}">`,
        ),
      ].join("\n    ");
      publishedAt = article.publishedAt;
      modifiedAt = article.updatedAt || article.publishedAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-image.jpg";
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
      modifiedAt = article.updatedAt || article.createdAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-image.jpg";
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
      modifiedAt = article.updatedAt || article.createdAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-image.jpg";
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

      medicalSpecialty = specName || undefined;
      title = `${fullName} — ${specName} | DocPats`.replace(/"/g, "&quot;");
      desc = (
        doctor.about || `Профиль врача ${fullName}, специальность: ${specName}`
      )
        .slice(0, 155)
        .replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/public/doctor-profile/doctor-details/${doctorId}`;
      publishedAt = null;
      imageUrl = doctor.profileImage || "https://docpats.com/og-image.jpg";

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

    html = stripShellSeo(html);

    const inject = `
    <title>${title} | DocPats</title>
    <meta name="description" content="${desc}" data-seo="edge">
    <link rel="canonical" href="${pageUrl}" data-seo="edge">
    ${alternateLinks}
    <meta data-seo="edge" property="og:type" content="${schemaType === "Physician" ? "profile" : "article"}">
    <meta data-seo="edge" property="og:title" content="${title}">
    <meta data-seo="edge" property="og:description" content="${desc}">
    <meta data-seo="edge" property="og:url" content="${pageUrl}">
    <meta data-seo="edge" property="og:image" content="${imageUrl}">
    <meta data-seo="edge" property="og:locale" content="${locale}">
    <meta data-seo="edge" name="twitter:card" content="summary_large_image">
    <meta data-seo="edge" name="twitter:title" content="${title}">
    <meta data-seo="edge" name="twitter:description" content="${desc}">
    <meta data-seo="edge" name="twitter:image" content="${imageUrl}">
    <script type="application/ld+json" data-seo="edge">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": schemaType,
      headline: schemaType !== "Physician" ? title : undefined,
      name: schemaType === "Physician" ? title : undefined,
      description: desc,
      url: pageUrl,
      inLanguage: locale,
      datePublished: publishedAt || undefined,
      dateModified: modifiedAt || undefined,
      // Явная привязка разметки к странице. Без неё Google связывает
      // объект со страницей по догадке, а на SPA, где один шелл обслуживает
      // все адреса, догадка регулярно промахивается.
      mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      image: imageUrl,
      medicalSpecialty:
        schemaType === "Physician" ? medicalSpecialty : undefined,
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
function stripShellSeo(html) {
  // Вырезать SEO-теги, которые принёс index.html: свои мы подставляем сами.
  //
  // Раньше каждая ветка чистила по-своему: страницы материала и клиники
  // снимали весь набор, а главная и документация — только <title> и
  // description. Из-за этого на / и /docs оставались og-теги оболочки, и
  // они шли в <head> РАНЬШЕ наших. Разворачиватели ссылок берут первое
  // вхождение — в Telegram и WhatsApp вместо названия раздела показывался
  // общий заголовок платформы. Google подмены не замечал: <title> и
  // description снимались во всех ветках.
  //
  // Регулярки намеренно не привязаны к порядку атрибутов: прежние требовали
  // rel/property сразу после имени тега и молча переставали совпадать при
  // любой правке шаблона.
  return (
    html
      .replace(/<title>.*?<\/title>/gs, "")
      .replace(/<meta[^>]+name="description"[^>]*>/gi, "")
      .replace(/<meta[^>]+property="og:[^"]*"[^>]*>/gi, "")
      .replace(/<meta[^>]+name="twitter:[^"]*"[^>]*>/gi, "")
      .replace(/<link[^>]+rel="canonical"[^>]*>/gi, "")
      // Только языковые alternate. Без уточнения по hreflang сюда попала бы
      // и ссылка автообнаружения RSS — она тоже rel="alternate".
      .replace(/<link[^>]+rel="alternate"[^>]+hreflang="[^"]*"[^>]*>/gi, "")
      // Оболочка несёт JSON-LD про платформу целиком (SoftwareApplication).
      // На конкретной странице он не к месту и давал лишнюю разметку.
      // Наш блок несёт data-seo="edge" и под эту регулярку не подпадает.
      .replace(
        /<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi,
        "",
      )
  );
}

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

// ЕДИНСТВЕННОЕ место, где объявляются адреса этой функции.
//
// Раньше объявления были размазаны по двум файлам: часть здесь, часть в
// [[edge_functions]] внутри netlify.toml. Netlify объединяет их, но при
// совпадении поля инлайновое объявление ПЕРЕКРЫВАЕТ toml — а `path`
// совпадал. Из-за этого "/clinics/*", записанный только в netlify.toml,
// молча не действовал: витрина клиники — единственная публичная страница,
// ради которой клиника вообще заводит сайт, — отдавала боту пустой
// SPA-шелл, хотя ветка её обработки в этом файле есть и написана.
//
// Ничего не добавлять в netlify.toml: список расширяется только здесь.
export const config = {
  path: [
    "/",
    "/docs/*",
    "/articles/*",
    "/news/*",
    "/clinics/*",
    "/public/doctor-profile/article-detail-for-all/*",
    "/public/doctor/article-scientific-detail-for-all/*",
    "/public/doctor-profile/doctor-details/*",
  ],
};
