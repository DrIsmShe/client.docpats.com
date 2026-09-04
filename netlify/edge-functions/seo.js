// Корневые сегменты, занятые самим приложением: по ним слаг клиники не
// ищем. Это ускорение, а НЕ защита: если сегмент сюда не попал, публичный
// API ответит 404 и запрос уйдёт дальше обычным путём. Ошибка в списке
// стоит одного лишнего запроса, а не сломанной страницы.
const RESERVED_ROOT = new Set([
  "about",
  "arena",
  "articles",
  "clinic",
  "clinics",
  "complete-registration",
  "consultation",
  "demo",
  "diagnostics",
  "docs",
  "doctor",
  "dp",
  "dp-videra",
  "education",
  "login",
  "medical-codes",
  "news",
  "patient",
  "pay",
  "payment",
  "previsit",
  "pricing",
  "public",
  "radiology",
  "registration",
  "terms-consent-page",
  "top-doctors",
  "user-synthesis",
  "webinar",
]);

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
      // Главная: текст статичный и русский.
      html = withHtmlLang(html, "ru");

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
      // Документация: разделы написаны по-русски.
      html = withHtmlLang(html, "ru");

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

      // Материал раздела документации: заголовок и первый абзац. Полный текст
      // не вставляем — он в markdown, и его разбор здесь превратился бы в
      // отдельный конвертер.
      html = injectBody(html, [tag("h1", heading), tag("p", desc)]);

      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {
      return context.next();
    }
  }

  // ── Врач и публикация внутри витрины ──
  //   /<slug>/doctors/<id>        (и /clinics/<slug>/doctors/<id>)
  //   /<slug>/publications/<id>   (и /clinics/<slug>/publications/<id>)
  //
  // Эти страницы появились, чтобы посетитель не уходил с сайта клиники на
  // страницы платформы. Ради этого их и стоило заводить — но без разметки они
  // были бы обменом одной проблемы на другую: адрес есть, а для поисковика
  // страница пустая.
  //
  // Клиника приходит внутри ответа API (поле clinic) — второй запрос за её
  // названием не нужен. Канонический адрес всегда корневой, как и у витрины.
  const vitrinaDoctorMatch = url.pathname.match(
    /^\/(?:clinics\/)?([a-z0-9-]+)\/doctors\/([a-f0-9]{24})\/?$/i,
  );
  const vitrinaPubMatch = url.pathname.match(
    /^\/(?:clinics\/)?([a-z0-9-]+)\/publications\/([a-f0-9]{24})\/?$/i,
  );
  const vitrinaMatch = vitrinaDoctorMatch || vitrinaPubMatch;

  if (vitrinaMatch && !RESERVED_ROOT.has(vitrinaMatch[1].toLowerCase())) {
    try {
      const isDoctor = Boolean(vitrinaDoctorMatch);
      const clinicSlug = vitrinaMatch[1];
      const entityId = vitrinaMatch[2];
      const segment = isDoctor ? "doctors" : "publications";

      const res = await fetch(
        `https://backend.docpats.com/api/v1/public/clinics/${encodeURIComponent(
          clinicSlug,
        )}/${segment}/${entityId}`,
      );
      if (!res.ok) return context.next();
      const data = await res.json();
      if (!data || (isDoctor ? !data.name : !data.title)) {
        return context.next();
      }

      const clinicName = data.clinic?.name || "";
      const clinicUrl = `https://docpats.com/${clinicSlug}`;
      const pageUrl = `${clinicUrl}/${segment}/${entityId}`;
      const publisher = {
        "@type": "MedicalClinic",
        name: clinicName,
        url: clinicUrl,
      };

      const clip = (v) =>
        String(v || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 155);

      let title, desc, image, jsonLd, ogType;

      if (isDoctor) {
        title = escAttr(
          clinicName ? `${data.name} — ${clinicName}` : data.name,
        );
        desc = escAttr(
          clip(data.about) ||
            [data.specialization, clinicName].filter(Boolean).join(", ") ||
            data.name,
        );
        image = data.profileImage || "https://docpats.com/og-image.jpg";
        ogType = "profile";
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Physician",
          name: data.name,
          url: pageUrl,
          image: data.profileImage || undefined,
          description: clip(data.about) || undefined,
          medicalSpecialty: data.specialization || undefined,
          // Врач показан именно как сотрудник этой клиники: страница живёт на
          // её адресе, и разметка не должна утверждать иного.
          worksFor: publisher,
        };
      } else {
        title = escAttr(
          clinicName ? `${data.title} — ${clinicName}` : data.title,
        );
        desc = escAttr(clip(data.metaDescription) || clip(data.abstract) || data.title);
        image = data.imageUrl || "https://docpats.com/og-image.jpg";
        ogType = "article";
        jsonLd = {
          "@context": "https://schema.org",
          // Научная статья и мнение врача — разные типы: для медицинского
          // домена это не косметика, Google разбирает их по-разному.
          "@type":
            data.kind === "scientific" ? "MedicalScholarlyArticle" : "Article",
          headline: data.title,
          url: pageUrl,
          image: data.imageUrl || undefined,
          description: clip(data.abstract) || undefined,
          datePublished: data.createdAt || undefined,
          dateModified: data.updatedAt || data.createdAt || undefined,
          author: data.author?.name
            ? {
                "@type": "Person",
                name: data.author.name,
                url: data.author.doctorId
                  ? `${clinicUrl}/doctors/${data.author.doctorId}`
                  : undefined,
              }
            : undefined,
          publisher,
        };
      }

      const response = await context.next();
      let html = await response.text();
      html = stripShellSeo(html);

      const inject = `
    <title>${title}</title>
    <meta name="description" content="${desc}" data-seo="edge">
    <link rel="canonical" href="${pageUrl}" data-seo="edge">
    <meta data-seo="edge" property="og:type" content="${ogType}">
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

      // Материал страницы. У публикации тело идёт ТЕКСТОМ: HTML из редактора
      // здесь никем не санитизируется, и вставлять его в нашу страницу значило
      // бы исполнять чужие скрипты у каждого посетителя.
      html = injectBody(
        html,
        isDoctor
          ? [
              tag("h1", data.name),
              tag("p", data.specialization),
              tag("p", data.about),
              link(clinicUrl, clinicName),
              Array.isArray(data.publications) && data.publications.length
                ? tag("h2", "Публикации врача") +
                  list(
                    data.publications
                      .slice(0, 40)
                      .map((p) =>
                        link(`${clinicUrl}/publications/${p.id}`, p.title),
                      ),
                  )
                : "",
            ]
          : [
              tag("h1", data.title),
              tag("p", data.abstract),
              data.author?.doctorId
                ? link(
                    `${clinicUrl}/doctors/${data.author.doctorId}`,
                    data.author.name,
                  )
                : tag("p", data.author?.name),
              tag("p", toText(data.content)),
              link(clinicUrl, clinicName),
            ],
      );

      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {
      return context.next();
    }
  }

  // ── Разделы витрины и кастомные страницы клиники ──
  //   /<slug>/<раздел>                          — раздел витрины
  //   /<slug>/dp/<страница>                     — кастомная страница
  //   /<slug>/dp/<страница>/articles/<статья>   — статья страницы
  //
  // Разделы линкуются из меню витрины, кастомные страницы попадают в карту
  // сайта, как только клиника их заведёт. До этой ветки бот приходил по обоим
  // адресам и получал пустой шелл — ровно ту проблему, ради которой делалась
  // разметка самой витрины, только уровнем ниже.
  const SECTION_TITLES = {
    about: "О клинике",
    departments: "Отделения",
    doctors: "Врачи",
    articles: "Статьи",
    gallery: "Галерея",
    reviews: "Отзывы",
    faq: "Вопросы и ответы",
    contacts: "Контакты",
    services: "Услуги и цены",
  };

  const sectionMatch = url.pathname.match(
    /^\/(?:clinics\/)?([a-z0-9-]+)\/(about|departments|doctors|articles|gallery|reviews|faq|contacts|services)\/?$/i,
  );
  const dpArticleMatch = url.pathname.match(
    /^\/(?:clinics\/)?([a-z0-9-]+)\/dp\/([a-z0-9-]+)\/articles\/([a-z0-9-]+)\/?$/i,
  );
  const dpPageMatch = dpArticleMatch
    ? null
    : url.pathname.match(/^\/(?:clinics\/)?([a-z0-9-]+)\/dp\/([a-z0-9-]+)\/?$/i);
  const vitrinaPageMatch = sectionMatch || dpArticleMatch || dpPageMatch;

  if (
    vitrinaPageMatch &&
    !RESERVED_ROOT.has(vitrinaPageMatch[1].toLowerCase())
  ) {
    try {
      const clinicSlug = vitrinaPageMatch[1];
      const clinicUrl = `https://docpats.com/${clinicSlug}`;
      const api = `https://backend.docpats.com/api/v1/public/clinics/${encodeURIComponent(
        clinicSlug,
      )}`;

      const clip = (v) =>
        String(v || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 155);

      // Относительный путь картинки живёт на медиа-домене — это делает
      // resolveUrl на клиенте. Разбираться в этом на превью-карточке некому,
      // поэтому всё, что не абсолютный адрес, заменяем общей картинкой.
      const absImage = (v) =>
        v && /^https?:\/\//.test(String(v))
          ? String(v)
          : "https://docpats.com/og-image.jpg";

      let title;
      let desc;
      let image;
      let jsonLd;
      let pageUrl;
      let ogType = "website";
      // Собираются по ходу ветки и используются ниже для материала страницы.
      let bodyDoctors = null;
      let bodyArticleText = "";
      let bodyClinicName = "";

      if (sectionMatch) {
        const section = sectionMatch[2].toLowerCase();
        const res = await fetch(api);
        if (!res.ok) return context.next();
        const clinic = await res.json();
        if (!clinic?.name) return context.next();

        bodyDoctors = Array.isArray(clinic.doctors) ? clinic.doctors : null;
        bodyClinicName = clinic.name || "";
        const label = SECTION_TITLES[section] || section;
        pageUrl = `${clinicUrl}/${section}`;
        title = escAttr(`${label} — ${clinic.name}`);
        desc = escAttr(
          clip(clinic.description) ||
            clip(clinic.slogan) ||
            `${label}: клиника ${clinic.name}`,
        );
        image = absImage(clinic.coverImage || clinic.logo);

        jsonLd = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${label} — ${clinic.name}`,
          url: pageUrl,
          isPartOf: {
            "@type": "MedicalClinic",
            name: clinic.name,
            url: clinicUrl,
          },
        };

        // Раздел врачей — единственный, где список сам по себе и есть ответ на
        // запрос («врачи клиники N»). Отдаём перечень, а не пустую обёртку.
        if (section === "doctors" && Array.isArray(clinic.doctors)) {
          jsonLd.mainEntity = {
            "@type": "ItemList",
            itemListElement: clinic.doctors.slice(0, 30).map((d, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Physician",
                name: d.name,
                url: d.id ? `${clinicUrl}/doctors/${d.id}` : undefined,
                medicalSpecialty: d.specialization || undefined,
              },
            })),
          };
        }
      } else if (dpArticleMatch) {
        const pageSlug = dpArticleMatch[2];
        const articleSlug = dpArticleMatch[3];
        const res = await fetch(
          `${api}/dp/${encodeURIComponent(pageSlug)}/articles/${encodeURIComponent(
            articleSlug,
          )}`,
        );
        if (!res.ok) return context.next();
        const article = await res.json();
        if (!article?.title) return context.next();

        const clinicName = article.clinic?.name || "";
        bodyClinicName = clinicName;
        bodyArticleText = toText(article.body || article.excerpt || "");
        pageUrl = `${clinicUrl}/dp/${pageSlug}/articles/${articleSlug}`;
        title = escAttr(
          clinicName ? `${article.title} — ${clinicName}` : article.title,
        );
        desc = escAttr(
          clip(article.metaDescription) ||
            clip(article.excerpt) ||
            article.title,
        );
        image = absImage(article.cover);
        ogType = "article";

        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          url: pageUrl,
          image: /^https?:\/\//.test(String(article.cover || ""))
            ? article.cover
            : undefined,
          description: clip(article.excerpt) || undefined,
          datePublished: article.createdAt || undefined,
          author: article.authors
            ? { "@type": "Person", name: article.authors }
            : undefined,
          publisher: {
            "@type": "MedicalClinic",
            name: clinicName,
            url: clinicUrl,
          },
        };
      } else {
        const pageSlug = dpPageMatch[2];
        const res = await fetch(`${api}/pages/${encodeURIComponent(pageSlug)}`);
        if (!res.ok) return context.next();
        const page = await res.json();
        if (!page?.title) return context.next();

        const clinicName = page.clinic?.name || "";
        bodyClinicName = clinicName;
        pageUrl = `${clinicUrl}/dp/${pageSlug}`;
        const heading = page.seo?.title || page.title;
        title = escAttr(clinicName ? `${heading} — ${clinicName}` : heading);
        desc = escAttr(clip(page.seo?.description) || heading);
        image = "https://docpats.com/og-image.jpg";

        jsonLd = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: heading,
          url: pageUrl,
          isPartOf: {
            "@type": "MedicalClinic",
            name: clinicName,
            url: clinicUrl,
          },
        };
      }

      const response = await context.next();
      let html = await response.text();
      html = stripShellSeo(html);

      const inject = `
    <title>${title}</title>
    <meta name="description" content="${desc}" data-seo="edge">
    <link rel="canonical" href="${pageUrl}" data-seo="edge">
    <meta data-seo="edge" property="og:type" content="${ogType}">
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

      // У раздела врачей материал — сам перечень со ссылками: именно он и есть
      // ответ на запрос «врачи клиники N». У остальных разделов текста нет,
      // поэтому ограничиваемся заголовком и возвратом на витрину.
      html = injectBody(html, [
        tag("h1", jsonLd.name || ""),
        tag("p", desc),
        sectionMatch && sectionMatch[2].toLowerCase() === "doctors" &&
        Array.isArray(bodyDoctors) &&
        bodyDoctors.length
          ? list(
              bodyDoctors
                .slice(0, 40)
                .map((d) =>
                  d.id
                    ? link(
                        `${clinicUrl}/doctors/${d.id}`,
                        [d.name, d.specialization].filter(Boolean).join(" — "),
                      )
                    : escHtml(d.name),
                ),
            )
          : "",
        bodyArticleText ? tag("p", bodyArticleText) : "",
        link(clinicUrl, bodyClinicName || "Клиника"),
      ]);

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
  // Витрина живёт по двум адресам: корневому /<slug> и старому
  // /clinics/<slug>. Корневой — тот, что кабинет выдаёт директору и который
  // расходится по соцсетям и визиткам, поэтому канонический именно он;
  // /clinics/<slug> обрабатываем тоже, чтобы уже разошедшиеся ссылки
  // отдавали разметку и указывали на канонический адрес, а не выглядели
  // для поисковика вторым независимым дублем страницы.
  //
  // Регулярка корневого адреса не допускает точку, поэтому запросы файлов
  // (/favicon.ico, /og-image.jpg, /sitemap.xml) сюда не попадают и уходят
  // дальше нетронутыми.
  const clinicMatch = url.pathname.match(/^\/clinics\/([a-z0-9-]+)\/?$/i);
  const rootMatch = url.pathname.match(/^\/([a-z0-9-]+)\/?$/i);
  const clinicSlug =
    clinicMatch?.[1] ||
    (rootMatch && !RESERVED_ROOT.has(rootMatch[1].toLowerCase())
      ? rootMatch[1]
      : null);

  if (clinicSlug) {
    try {
      const slug = clinicSlug;

      // Язык витрины. Описание и слоган приходят с сервера уже переведёнными,
      // если у клиники есть перевод; если нет — сервер отдаёт язык оригинала и
      // сообщает об этом полем language.
      const askedLocale = (url.searchParams.get("locale") || "")
        .slice(0, 2)
        .toLowerCase();
      const localeQuery = /^(ru|en|az|tr|ar)$/.test(askedLocale)
        ? `?locale=${askedLocale}`
        : "";

      const res = await fetch(
        `https://backend.docpats.com/api/v1/public/clinics/${encodeURIComponent(slug)}${localeQuery}`,
      );
      if (!res.ok) return context.next();
      const clinic = await res.json();
      if (!clinic?.name) return context.next();

      const langs = Array.isArray(clinic.availableLanguages)
        ? clinic.availableLanguages
        : [];
      // Оригинал — тот язык, что отдаётся по ГОЛОМУ адресу. Берём его полем
      // DTO, а не первым элементом списка: clinicLanguages() на сервере
      // возвращает языки в фиксированном порядке (ru, en, az, tr, ar), и для
      // клиники с оригиналом az и переводом на ru первым шёл бы ru. Тогда
      // hreflang="ru" указывал бы на адрес, где сервер отдаёт азербайджанский,
      // а canonical голой страницы уезжал на ?locale=az. Фолбэки оставлены
      // для ответов, отданных из кэша до появления поля.
      const original =
        clinic.originalLanguage || langs[0] || clinic.language || "ru";
      const shown = clinic.language || original;
      const base = `https://docpats.com/${slug}`;
      const urlFor = (lang) => (lang === original ? base : `${base}?locale=${lang}`);

      // canonical указывает на язык, который РЕАЛЬНО отдан, а не на который
      // просили. Просят язык без перевода — сервер вернул оригинал, и адрес с
      // ?locale= для него был бы вторым адресом одного и того же текста.
      const pageUrl = urlFor(shown);

      // hreflang связывает только версии с СОБСТВЕННЫМ текстом. Перечислять
      // все пять языков, когда четыре показывают один и тот же русский текст,
      // — не языковая разметка, а её видимость: поисковик не может
      // проиндексировать пять версий одной страницы.
      const alternates =
        langs.length > 1
          ? [
              `<link data-seo="edge" rel="alternate" hreflang="x-default" href="${base}">`,
              ...langs.map(
                (l) =>
                  `<link data-seo="edge" rel="alternate" hreflang="${l}" href="${urlFor(l)}">`,
              ),
            ].join("\n    ")
          : "";
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
        inLanguage: shown,
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
      // Витрина: контент запрошен у API с этой локалью.
      html = withHtmlLang(html, shown);

      const inject = `
    <title>${title} | DocPats</title>
    <meta name="description" content="${desc}" data-seo="edge">
    <link rel="canonical" href="${pageUrl}" data-seo="edge">
    ${alternates}
    <meta data-seo="edge" property="og:locale" content="${shown}">
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

      // Материал витрины для тех, кто не выполняет JS: название, описание,
      // контакты и — главное — ССЫЛКИ на врачей, разделы и публикации. Без них
      // обходить страницу нечем, и всё, что глубже главной, обнаруживается
      // только через карту сайта.
      const sectionLinks = [
        ["about", "О клинике"],
        ["departments", "Отделения"],
        ["doctors", "Врачи"],
        ["articles", "Статьи"],
        ["gallery", "Галерея"],
        ["reviews", "Отзывы"],
        ["faq", "Вопросы и ответы"],
        ["contacts", "Контакты"],
        ["services", "Услуги и цены"],
      ].map(([key, label]) => link(`${base}/${key}`, label));

      const addressLine = [address.country, address.city, address.street]
        .filter(Boolean)
        .join(", ");

      html = injectBody(html, [
        tag("h1", clinic.name),
        tag("p", clinic.slogan),
        tag("p", clinic.description),
        addressLine ? tag("p", addressLine) : "",
        clinic.callCenterPhone ? tag("p", clinic.callCenterPhone) : "",
        Array.isArray(clinic.doctors) && clinic.doctors.length
          ? tag("h2", "Врачи") +
            list(
              clinic.doctors
                .slice(0, 40)
                .map((d) =>
                  d.id
                    ? link(
                        `${base}/doctors/${d.id}`,
                        [d.name, d.specialization].filter(Boolean).join(" — "),
                      )
                    : escHtml(d.name),
                ),
            )
          : "",
        Array.isArray(clinic.publications) && clinic.publications.length
          ? tag("h2", "Публикации") +
            list(
              clinic.publications
                .slice(0, 40)
                .map((p) => link(`${base}/publications/${p.id}`, p.title)),
            )
          : "",
        tag("h2", "Разделы") + list(sectionLinks),
      ]);

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
    // Материал или новость: локаль разобрана из адреса.
    html = withHtmlLang(html, locale);

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
// ─── Содержимое для тех, кто не выполняет JS ───────────────────────────────
//
// В сыром HTML у SPA пусто: <div id="root"></div> и скрипты. Мета-теги мы
// подставили, но у страницы нет ни текста, ни ЕДИНОЙ ССЫЛКИ. Для главной это
// терпимо. Для платформы, где должны индексироваться десятки витрин, профилей
// врачей и статей, это дыра: обходить нечего, граф ссылок не существует до
// отрисовки, и карта сайта остаётся единственным каналом обнаружения.
//
// Поэтому в корневой div кладётся тот же материал, который через мгновение
// отрисует React: заголовок, текст, ссылки. Клоакингом это не является —
// подставляется ровно то, что видит посетитель. React при монтировании
// заменяет содержимое контейнера своим, поэтому дублирования не будет.
//
// ВАЖНО: сюда нельзя класть HTML из редактора статей. На клиенте он проходит
// через DOMPurify, здесь такой обработки нет, а вставка сырого тела статьи в
// нашу страницу означала бы исполнение чужих скриптов у каждого посетителя.
// Поэтому тело статьи идёт текстом: теги вырезаны, содержимое экранировано.

function escHtml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** HTML → текст: теги прочь, пробелы схлопнуть, длину ограничить. */
function toText(html, limit = 4000) {
  const plain = String(html ?? "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > limit ? plain.slice(0, limit) + "…" : plain;
}

function tag(name, value) {
  const text = escHtml(value).trim();
  return text ? `<${name}>${text}</${name}>` : "";
}

function link(href, text) {
  const label = escHtml(text).trim();
  return label ? `<a href="${escAttr(href)}">${label}</a>` : "";
}

function list(items) {
  const rows = items.filter(Boolean).map((i) => `<li>${i}</li>`);
  return rows.length ? `<ul>${rows.join("")}</ul>` : "";
}

/**
 * Положить материал в корневой контейнер.
 *
 * Инжект идёт ВНУТРЬ #root, а не рядом: React очищает контейнер при
 * монтировании, поэтому у посетителя не останется второй копии текста.
 */
function injectBody(html, parts) {
  const body = parts.filter(Boolean).join("\n");
  if (!body) return html;
  return html.replace(
    '<div id="root"></div>',
    `<div id="root"><main>${body}</main></div>`,
  );
}

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

// Языки, которые пишутся справа налево. Список продублирован в
// src/lib/language.js — значения ОБЯЗАНЫ совпадать: здесь атрибут ставится в
// сыром HTML для бота, там подтверждается приложением для человека, и
// расхождение дало бы прыжок раскладки на первом кадре.
const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);

/**
 * Проставить язык и направление письма самому документу.
 *
 * Оболочка index.html зашита с <html lang="en"> — одним значением на все пять
 * языков. Для бота это и есть язык страницы: он читает сырой HTML и до
 * выполнения JS не доходит, поэтому клиентская правка (src/i18n.js) до него
 * не долетает. Арабская страница, объявленная английской, — несовпадение
 * заявленного и фактического языка, ровно то, из-за чего версия выпадает
 * из индекса.
 *
 * Вызывается ТОЛЬКО там, где язык действительно известен и контент ему
 * следует. Ветки, которые локаль не разрешают, оставлены как есть намеренно:
 * соврать про язык хуже, чем промолчать.
 */
function withHtmlLang(html, lang) {
  const code = String(lang || "").slice(0, 2).toLowerCase();
  if (!code) return html;
  const dir = RTL_LANGS.has(code) ? "rtl" : "ltr";
  // Заменяем открывающий <html ...> целиком: у него могут быть свои атрибуты
  // (их сохраняем), а lang/dir выставляем свои. Регулярка нежадная и
  // ограничена первым вхождением — второго <html> в документе быть не может.
  return html.replace(/<html([^>]*)>/i, (match, attrs) => {
    const kept = String(attrs)
      .replace(/\s+lang="[^"]*"/gi, "")
      .replace(/\s+dir="[^"]*"/gi, "")
      .trim();
    return `<html${kept ? " " + kept : ""} lang="${code}" dir="${dir}">`;
  });
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
    // Витрина по корневому слагу. Односегментный шаблон URLPattern: под него
    // попадает и /login, и /pricing — отсекаются они в RESERVED_ROOT, а всё
    // незнакомое проверяется запросом к публичному API.
    "/:slug",
    // Врач и публикация внутри витрины. Отдельными шаблонами, а не "/:slug/*":
    // тот покрыл бы и /patient/appointments, и /doctor/schedule — весь
    // авторизованный раздел приложения.
    "/:slug/doctors/*",
    "/:slug/publications/*",
    // Разделы витрины перечислены поимённо, а не шаблоном "/:slug/:section":
    // тот покрыл бы половину приложения — /clinic/leads, /patient/home-page,
    // /doctor/dashboard и так далее.
    "/:slug/about",
    "/:slug/departments",
    "/:slug/doctors",
    "/:slug/articles",
    "/:slug/gallery",
    "/:slug/reviews",
    "/:slug/faq",
    "/:slug/contacts",
    "/:slug/services",
    "/:slug/dp/*",
  ],
  // Файлы в корне (favicon.ico, og-image.jpg, sitemap.xml, sw.js) шаблону
  // "/:slug" тоже соответствуют. Внутри функции они отсеиваются регуляркой,
  // но дешевле не запускать её вовсе.
  excludedPath: [
    "/*.js",
    "/*.css",
    "/*.json",
    "/*.xml",
    "/*.txt",
    "/*.ico",
    "/*.png",
    "/*.jpg",
    "/*.jpeg",
    "/*.webp",
    "/*.svg",
    "/*.html",
    "/*.map",
  ],
};
