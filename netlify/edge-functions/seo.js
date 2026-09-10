import {
  витринныйАдрес,
  знакомыйКорень,
  служебныйАдрес,
} from "./lib/public-routes.js";

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
  // Витрина роликов и страница встраивания. Без них функция
  // принимала "videos" за слаг клиники и уходила в ветку витрины,
  // а ссылка на ролик в ленте соцсети показывала общую заставку.
  "videos",
  "embed",
  "webinar",
]);


/* ── Разделы-списки ────────────────────────────────────────────────────
 *
 * Это входные страницы: по ним ищут «медицинские новости», «научные
 * статьи», «тарифы». До этого каждая отдавала общий title оболочки и
 * canonical на главную — то есть объявляла себя копией главной. Текста в
 * них тоже не было: React рисует список после запроса к API, а робот до
 * этого не доходит.
 *
 * Содержимое здесь намеренно короткое и статичное: список материалов
 * меняется ежечасно, и вписывать его в HTML значило бы отдавать роботу
 * снимок, который устареет раньше, чем он до него дойдёт. Задача этой
 * ветки — объяснить, что за раздел, и дать ссылки вглубь.
 */
const SECTIONS = {
  "/news": {
    title: "Медицинские новости и исследования — DocPats",
    desc:
      "Лента медицинских новостей и разборов исследований: клинические " +
      "рекомендации, публикации и обзоры для практикующих врачей. Пять языков.",
    h1: "Лента медицинских новостей",
    text:
      "Новости медицины и разборы исследований, отобранные для практикующих " +
      "врачей: клинические рекомендации, публикации, обзоры доказательной базы.",
    links: [
      ["/articles", "Научные статьи и аналитика"],
      ["/conferences", "Медицинские конференции"],
    ],
  },
  "/articles": {
    title: "Научные статьи и аналитика — DocPats",
    desc:
      "Научные разборы врачей и аналитика по медицинским источникам: " +
      "доказательная база, методы, клинические выводы. Обновляется ежедневно.",
    h1: "Научные статьи",
    text:
      "Разборы врачей и аналитика по медицинским и научным источникам. " +
      "Каждая статья содержит перечень источников и разбор доказательной базы.",
    links: [
      ["/news", "Лента медицинских новостей"],
      ["/videos", "Медицинские ролики DP-Tube"],
    ],
  },
  "/videos": {
    title: "DP-Tube — медицинские ролики от врачей и клиник",
    desc:
      "Разъяснительные медицинские фильмы: подготовка к процедурам, разборы " +
      "снимков и анализов, анатомия и операции. Смотреть можно без регистрации.",
    h1: "DP-Tube — медицинские ролики",
    text:
      "Разъяснительные фильмы, которые врач показывает пациенту: подготовка " +
      "к процедуре, разбор снимка, ход операции. Смотреть можно без входа.",
    links: [
      ["/articles", "Научные статьи"],
      ["/pricing", "Тарифы для врачей и клиник"],
    ],
  },
  "/pricing": {
    title: "Тарифы DocPats — для клиник, врачей и пациентов",
    desc:
      "Стоимость платформы для клиник, частных врачей и пациентов: что входит " +
      "в каждый план, лимиты приёмов, документов и ИИ-разборов.",
    h1: "Тарифы",
    text:
      "Планы для клиник, частных врачей и пациентов: ведение пациентов и " +
      "приёмов, документы, ИИ-разборы, медицинские фильмы.",
    links: [
      ["/docs/for-doctors", "Врачу о платформе"],
      ["/docs/clinic", "Клинике о платформе"],
    ],
  },
  "/conferences": {
    title: "Медицинские конференции — программы и условия участия",
    desc:
      "Календарь медицинских конференций: программа, сроки регистрации, " +
      "условия участия. Для врачей, планирующих выступления и обучение.",
    h1: "Медицинские конференции",
    text:
      "Календарь конференций с программой, сроками регистрации и условиями " +
      "участия — для врачей, которые планируют выступления и обучение.",
    links: [["/news", "Лента медицинских новостей"]],
  },
  "/about": {
    title: "О платформе DocPats — кто её делает и для кого",
    desc:
      "Кто стоит за платформой, из чего она выросла и какие задачи клиники " +
      "и врача закрывает: ведение пациентов, документы, 3D-объяснения.",
    h1: "О платформе",
    text:
      "Платформа выросла из практики ЛОР-врача: объяснить пациенту, что с " +
      "ним происходит, словами на приёме не выходит — выходит фильмом. " +
      "Вокруг этого собраны ведение пациентов, приёмы, документы и согласия.",
    links: [
      ["/docs/for-doctors", "Врачу о платформе"],
      ["/docs/for-patients", "Пациенту о платформе"],
      ["/pricing", "Тарифы"],
    ],
  },
  "/demo": {
    title: "Демо-версия DocPats — посмотреть платформу без регистрации",
    desc:
      "Демонстрационный доступ: кабинет клиники, приём врача, документы и " +
      "разъяснительные фильмы на вымышленных данных, без регистрации.",
    h1: "Демо-версия",
    text:
      "Кабинет клиники, приём врача, документы и разъяснительные фильмы — " +
      "на вымышленных данных, без регистрации и без риска для чьей-либо " +
      "медицинской тайны.",
    links: [
      ["/pricing", "Тарифы"],
      ["/docs/clinic", "Клинике о платформе"],
    ],
  },
  "/top-doctors": {
    title: "Врачи на DocPats — профили, специальности, отзывы",
    desc:
      "Врачи платформы: специальность, страна, оценки пациентов. Профиль " +
      "врача открыт без регистрации.",
    h1: "Врачи",
    text:
      "Специальность, страна и оценки пациентов. Профиль врача открывается " +
      "без регистрации — с публикациями, роликами и записью на приём.",
    links: [
      ["/articles", "Научные статьи врачей"],
      ["/videos", "Медицинские ролики"],
    ],
    /* Канонический адрес страница ставит себе сама, с учётом фильтра по
       специальности. Второй, отличающийся, обесценил бы оба. */
    безCanonical: true,
  },
  "/docs": {
    title: "Документация DocPats — как устроена платформа",
    desc:
      "Разделы документации: врачу, пациенту, клинике; приёмы, документы, " +
      "диагностика, подготовка к экзаменам, приватность и HIPAA.",
    h1: "Документация",
    text:
      "Как устроена платформа — по разделам: врачу, пациенту и клинике, " +
      "приёмы и документы, диагностика, подготовка к экзаменам, приватность.",
    links: [
      ["/docs/for-doctors", "Врачу о платформе"],
      ["/docs/for-patients", "Пациенту о платформе"],
      ["/docs/clinic", "Клинике о платформе"],
      ["/docs/hipaa", "HIPAA: что сделано в платформе"],
      ["/docs/privacy", "Приватность данных"],
    ],
  },
  "/education": {
    title: "Подготовка к медицинским экзаменам — тесты и разбор ошибок",
    desc:
      "Тренировка, пробные экзамены и разбор ошибок для врачей: большие " +
      "экзамены проходятся блоками, с объяснением каждого ответа.",
    h1: "Подготовка к экзаменам",
    text:
      "Тренировка, пробные экзамены и разбор ошибок. Большие экзамены можно " +
      "проходить блоками — по частям, а не все вопросы разом.",
    links: [["/docs/exams", "Как устроена подготовка"]],
  },
};

export default async function handler(request, context) {
  const url = new URL(request.url);

  /* Адрес, чей первый сегмент приложению незнаком, — это не страница.
     Netlify отдаёт оболочку со статусом 200 на любой путь, и /en, /zzz и
     всякая опечатка выглядели для поисковика полноценными страницами: он
     их обходил и считал дублями. Человек при этом видит обычный экран
     «страница не найдена» — меняется только статус, который видит робот.

     Односегментные адреса пропускаем: это может быть витрина клиники, и
     её проверяет запросом к API ветка ниже. Файлы не трогаем вовсе — у
     них свой отдающий и свой статус. */
  /* Отсечка по первому сегменту. Работает только для адресов, которые
     функция и так обслуживает: общий шаблон "/*" убран (см. config), и
     незнакомые адреса теперь отсекает CDN правилом в _redirects. Здесь
     проверка осталась для вложенных путей витрины: /<слаг>/doctors/<id>
     объявлен в config.path, и если слага нет, отвечать должна функция. */
  const сегментов = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (
    сегментов.length > 1 &&
    !служебныйАдрес(url.pathname) &&
    !знакомыйКорень(url.pathname) &&
    // Витрина клиники стоит на корневом слаге: её разделы и страницы
    // врачей проверкой первого сегмента не опознаются, а 404 на них —
    // это 404 на адресах из собственной карты сайта.
    !витринныйАдрес(url.pathname)
  ) {
    return отдать404(context);
  }

  // ── Главная страница: свои title/description/OG + WebSite JSON-LD ──
  // SPA-шелл иначе отдаёт боту только статичный <title> без структурных данных.
  if (url.pathname === "/") {
    try {
      /* Адресат один — клиника. Прежний заголовок звал «врачей,
         пациентов и клиник» разом, то есть никого, и ставил платформу
         рядом с MedElement и Doc+ на их поле. Здесь названо то, чего у
         них нет: разъяснительные 3D-фильмы и ЛОР-профиль, с которого
         платформа начинается. */
      const title =
        "DocPats — платформа для клиник: ЛОР-профиль и 3D-объяснения";
      const desc =
        "Ведение пациентов и приёмов, документы и согласия, разъяснительные " +
        "3D-фильмы по анатомии и операциям, ИИ-поддержка решений врача. " +
        "Пять языков, шифрование данных и журнал доступа.";
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

      /* Содержимое для тех, кто не выполняет JS. Без него у главной в сыром
         HTML нет ни слова текста и ни одной ссылки: обходить нечего, и граф
         ссылок не существует до отрисовки. Ссылки здесь — не украшение, а
         единственный путь робота к витринам, статьям и новостям. */
      html = injectBody(html, [
        tag("h1", "DocPats — платформа для клиник и врачей"),
        tag(
          "p",
          "Клиника ведёт пациентов, приёмы и документы; врач объясняет " +
            "пациенту разъяснительным 3D-фильмом, а не словами на приёме. " +
            "ЛОР-профиль, ИИ-поддержка решений, пять языков, шифрование " +
            "данных и журнал доступа.",
        ),
        tag("h2", "Разделы платформы"),
        list([
          link("/news", "Лента медицинских новостей"),
          link("/articles", "Научные статьи и аналитика"),
          link("/videos", "DP-Tube — медицинские ролики"),
          link("/conferences", "Медицинские конференции"),
          link("/education", "Подготовка к экзаменам"),
          link("/pricing", "Тарифы"),
          link("/docs/for-doctors", "Врачу о платформе"),
          link("/docs/for-patients", "Пациенту о платформе"),
        ]),
      ]);

      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {
      return context.next();
    }
  }

  // ── Разделы-списки: /news, /articles, /videos, /pricing … ──
  const section = SECTIONS[url.pathname.replace(/\/$/, "") || "/"];
  if (section) {
    try {
      const pageUrl = `https://docpats.com${url.pathname.replace(/\/$/, "")}`;
      const image = "https://docpats.com/og-image.jpg";

      const response = await context.next();
      let html = await response.text();
      html = stripShellSeo(html);
      html = withHtmlLang(html, "ru");

      const inject = `
    <title>${escAttr(section.title)}</title>
    <meta name="description" content="${escAttr(section.desc)}" data-seo="edge">
    ${section.безCanonical ? "" : `<link rel="canonical" href="${pageUrl}" data-seo="edge">`}
    <meta data-seo="edge" property="og:type" content="website">
    <meta data-seo="edge" property="og:title" content="${escAttr(section.title)}">
    <meta data-seo="edge" property="og:description" content="${escAttr(section.desc)}">
    <meta data-seo="edge" property="og:url" content="${pageUrl}">
    <meta data-seo="edge" property="og:image" content="${image}">
    <meta data-seo="edge" name="twitter:card" content="summary_large_image">
    <meta data-seo="edge" name="twitter:title" content="${escAttr(section.title)}">
    <meta data-seo="edge" name="twitter:description" content="${escAttr(section.desc)}">
    <meta data-seo="edge" name="twitter:image" content="${image}">
    <script type="application/ld+json" data-seo="edge">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: section.title,
      url: pageUrl,
      description: section.desc,
      inLanguage: "ru",
      isPartOf: {
        "@type": "WebSite",
        name: "DocPats",
        url: "https://docpats.com",
      },
    })}</script>`;

      html = html.replace("</head>", inject + "</head>");
      html = injectBody(html, [
        tag("h1", section.h1),
        tag("p", section.text),
        list(section.links.map(([href, label]) => link(href, label))),
      ]);

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

      /* Прежние адреса разделов. Они попали в HTML главной и могли
         разойтись по переписке; отправлять человека на 404 из-за нашей
         же опечатки незачем. */
      const ПЕРЕЕХАЛИ = { doctor: "for-doctors", patient: "for-patients" };
      if (ПЕРЕЕХАЛИ[section]) {
        return new Response(null, {
          status: 301,
          headers: { location: `/docs/${ПЕРЕЕХАЛИ[section]}` },
        });
      }

      // Русский — язык оригинала корпуса. Все языки живут по одному адресу,
      // поэтому в индекс попадает одна версия; отдельные адреса на язык и
      // hreflang — следующий шаг, если раздел начнёт приводить трафик.
      /* Раздела нет — отвечаем 404, а не оболочкой со статусом 200.
         «Мягкий 404» стоит дважды: поисковик тратит на него обход и
         считает такие адреса дублями, а человек видит платформу вместо
         текста, за которым пришёл. */
      const нетРаздела = () => отдать404(context);

      const mdRes = await fetch(`${url.origin}/docs/${section}/ru.md`);
      if (!mdRes.ok) return нетРаздела();

      const md = await mdRes.text();
      // Netlify отдаёт index.html со статусом 200 на несуществующий путь,
      // поэтому ok здесь ничего не доказывает.
      if (md.trimStart().startsWith("<")) return нетРаздела();

      const heading = titleFromMarkdown(md);
      const desc = descriptionFromMarkdown(md);
      if (!heading || !desc) return нетРаздела();

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
      if (!res.ok) return нетМатериала(res, context);
      const data = await res.json();
      if (!data || (isDoctor ? !data.name : !data.title)) {
        return отдать404(context);
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
        краткоеОписание(String(v || "").replace(/<[^>]*>/g, " "));

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
        краткоеОписание(String(v || "").replace(/<[^>]*>/g, " "));

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
        if (!res.ok) return нетМатериала(res, context);
        const clinic = await res.json();
        if (!clinic?.name) return отдать404(context);

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
        if (!res.ok) return нетМатериала(res, context);
        const article = await res.json();
        if (!article?.title) return отдать404(context);

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
        if (!res.ok) return нетМатериала(res, context);
        const page = await res.json();
        if (!page?.title) return отдать404(context);

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

      /* Клиники с таким слагом нет — значит адреса нет вовсе, если он не
         принадлежит самому приложению (/login, /pricing и прочие
         односегментные зоны проверяются списком). */
      /* Оговорка про знакомый корень нужна только КОРНЕВОЙ форме
         /<слаг>: под неё попадают и зоны приложения. У /clinics/<слаг>
         двусмысленности нет — нет клиники, нет страницы. */
      const нетТакого = () =>
        !clinicMatch && знакомыйКорень(url.pathname)
          ? context.next()
          : отдать404(context);

      const res = await fetch(
        `https://backend.docpats.com/api/v1/public/clinics/${encodeURIComponent(slug)}${localeQuery}`,
      );
      if (!res.ok) return нетТакого();
      const clinic = await res.json();
      if (!clinic?.name) return нетТакого();

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
        краткоеОписание(
          clinic.description || clinic.slogan || `Клиника ${clinic.name}`,
        ),
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

  /* Старая форма языкового адреса синтез-статьи: /articles/<id>/<язык>.
     Язык в проекте передаётся параметром — одна схема на все материалы,
     иначе каждая страница доступна по двум адресам сразу. Отвечаем 301, а
     не молча рендерим: адреса этой формы полгода лежали в карте сайта, и
     склеить их с новыми должен поисковик, а не мы задним числом. */
  if (articleMatch?.[2] && ЯЗЫК(articleMatch[2])) {
    return new Response(null, {
      status: 301,
      headers: {
        location: `/articles/${articleMatch[1]}?locale=${ЯЗЫК(articleMatch[2])}`,
      },
    });
  }
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
  // Ролик каталога. Ссылку на него шлют пациенту и коллеге в мессенджер,
  // и там от неё ждут кадр и название, а не общую заставку платформы.
  const videoMatch = url.pathname.match(/^\/videos\/([a-f0-9]{24})\/?$/);

  if (
    !articleMatch &&
    !newsMatch &&
    !doctorArticleMatch &&
    !scientificArticleMatch &&
    !doctorProfileMatch &&
    !videoMatch
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
    // Ролик: длительность в ISO 8601 и адрес страницы плеера. Плеер нужен,
    // чтобы Facebook и LinkedIn проигрывали ролик прямо в ленте, а не
    // уводили по ссылке — половина зрителей по ссылке не идёт.
    let videoDuration, embedUrl;
    // hreflang в сыром HTML — до того, как отработает JS. Helmet ставит те
    // же теги, но уже после рендера; часть роботов до этого не доходит.
    let alternateLinks = "";
    /* Текст материала для сырого HTML. Заполняется в каждой ветке своим
       полем: у синтеза это markdown, у новости — сводка, у врачебной
       статьи — тело из редактора (только текстом, см. заголовок файла). */
    let bodyText = "";
    /* Закрыть материал от индексации. Нужно новостям: там лежат полные
       тексты чужих публикаций и их машинные переводы, а массовая
       републикация чужого подпадает под правило Google о scaled content
       abuse — с санкцией на весь домен, включая витрины клиник. */
    let noIndex = false;
    /* Издатель материала. По умолчанию — мы: своя аналитика, врачебные
       статьи, ролики действительно наши. Новость переопределяет его на
       оригинальное издание, и туда же ведёт основаноНа. */
    let издательМатериала = null;
    let основаноНа = null;

    if (articleMatch) {
      const articleId = articleMatch[1];
      const urlLocale = ЯЗЫК(url.searchParams.get("locale"));
      const cookieHeader = request.headers.get("cookie") || "";
      const cookieLocale = cookieHeader.match(/locale=([a-z]{2})/)?.[1];
      locale = urlLocale || cookieLocale || "ru";
      schemaType = "MedicalWebPage";

      /* Просим язык у API. Он отдаёт перевод, если тот УЖЕ готов в кэше,
         и оригинал, если нет; заказывать перевод GET не станет — заказ
         стоит денег, а GET дёргают роботы. До этого сюда всегда приезжал
         оригинал, и по адресу /articles/<id>/en робот видел русский
         текст под английским заголовком. */
      const res = await fetch(
        `https://news-api.docpats.com/api/synthesis/${articleId}?locale=${locale}`,
      );
      if (!res.ok) return нетМатериала(res, context);
      const data = await res.json();
      const article = data?.article;
      if (!article) return отдать404(context);

      /* Языковые версии — только существующие. translatedLocales приходит
         из движка и перечисляет языки с ГОТОВЫМ переводом; статья без
         переводов языковых адресов не заводит вовсе. */
      const оригинал = ЯЗЫК(article.language) || "ru";
      const переводы = Array.isArray(article.translatedLocales)
        ? article.translatedLocales.map(ЯЗЫК).filter(Boolean)
        : [];
      const языки = [
        оригинал,
        ...переводы.filter((l) => l !== оригинал),
      ];
      const базаСтатьи = `https://docpats.com/articles/${articleId}`;
      /* Язык — параметром, как у новостей, врачебных статей и витрин.
         Сегментом пути он стоял только здесь; две схемы разом означают,
         что каждая страница доступна по двум адресам. Старая форма
         отвечает 301 (см. выше), поэтому проиндексированные /articles/
         <id>/en склеятся с новыми, а не останутся дублями. */
      const адресЯзыка = (l) =>
        l === оригинал ? базаСтатьи : `${базаСтатьи}?locale=${l}`;

      // Отданный язык, а не запрошенный: перевода нет — показан оригинал.
      locale = ЯЗЫК(article.servedLocale) || оригинал;

      if (языки.length > 1) {
        alternateLinks = [
          `<link data-seo="edge" rel="alternate" hreflang="x-default" href="${базаСтатьи}">`,
          ...языки.map(
            (l) =>
              `<link data-seo="edge" rel="alternate" hreflang="${l}" href="${адресЯзыка(l)}">`,
          ),
        ].join("\n    ");
      }

      const seo = article.seo?.[locale] || article.seo?.ru || {};
      title = (seo.title || article.title || "")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, " ")
        .trim();
      desc = краткоеОписание(
        seo.description ||
          String(article.body || "").replace(/#+\s/g, ""),
      ).replace(/"/g, "&quot;");
      /* Канонический адрес — язык, который РЕАЛЬНО отдан. Просили
         локаль без перевода: показан оригинал, и языковой адрес был бы
         вторым адресом того же текста. */
      pageUrl = адресЯзыка(locale);
      publishedAt = article.createdAt;
      modifiedAt = article.updatedAt || article.createdAt;
      imageUrl = "https://docpats.com/og-image.jpg";
      // Markdown без разметки: заголовки и списки роботу не нужны, а
      // звёздочки в тексте выглядят как опечатки.
      bodyText = toText(
        String(article.body || "").replace(/[#*_>`]/g, " "),
        6000,
      );
    } else if (newsMatch) {
      // Чужой материал: в индекс не отдаём, ссылки со страницы — работают.
      noIndex = true;
      const slug = newsMatch[1];
      const cookieHeader = request.headers.get("cookie") || "";
      const cookieLocale = cookieHeader.match(/locale=([a-z]{2})/)?.[1];
      const urlLocale = url.searchParams.get("locale");
      locale = urlLocale || cookieLocale || "en";
      schemaType = "NewsArticle";

      const res = await fetch(
        `https://news-api.docpats.com/api/news/${slug}?locale=${locale}`,
      );
      if (!res.ok) return нетМатериала(res, context);
      const data = await res.json();
      const article = data?.data;
      if (!article) return отдать404(context);

      title = (article.title || "").replace(/"/g, "&quot;");
      desc = краткоеОписание(
        article.aiSummaryShort || article.summary || "",
      ).replace(/"/g, "&quot;");

      /* Издатель — ОРИГИНАЛЬНОЕ издание, а не мы.
         Здесь стояло «publisher: DocPats» на материале STAT News и PLOS:
         разметка утверждала, что чужую статью опубликовали мы. Ставим
         настоящее издание и связываем страницу с первоисточником через
         isBasedOn и sameAs — адрес оригинала лежит в базе движка
         (canonicalUrl есть у всех записей, проверено выборкой). */
      const издание = String(article.sourceName || "").trim();
      /* Метки рассылки в адресе оригинала убираем: движок берёт адрес из
         RSS, и там он приходит с utm_campaign. Со ссылкой на оригинал это
         значит «оригинал вон по тому адресу с нашей меткой» — а метка
         делает адрес другим, и указание на первоисточник промахивается. */
      const адресОригинала = (() => {
        const сырой = String(article.canonicalUrl || "").trim();
        if (!сырой) return "";
        try {
          const u = new URL(сырой);
          for (const имя of [...u.searchParams.keys()]) {
            if (/^(utm_|fbclid|gclid|yclid|ref$)/i.test(имя)) {
              u.searchParams.delete(имя);
            }
          }
          return u.toString().replace(/\?$/, "");
        } catch {
          return сырой;
        }
      })();
      if (издание) {
        let сайтИздания;
        try {
          сайтИздания = адресОригинала
            ? new URL(адресОригинала).origin
            : undefined;
        } catch {
          сайтИздания = undefined;
        }
        издательМатериала = {
          "@type": "Organization",
          name: издание,
          ...(сайтИздания ? { url: сайтИздания } : {}),
        };
      }
      if (адресОригинала) основаноНа = адресОригинала;

      // Язык — тот, на котором материал НАПИСАН. Стояло значение из
      // запроса, и английский текст объявлялся русским.
      locale = ЯЗЫК(article.language) || "en";
      // Английская версия живёт на голом адресе; ?locale=en нормализуем в
      // него же, иначе в индекс попадут два адреса с одним содержимым.
      const newsBase = `https://docpats.com/news/${slug}`;
      const оригинал = ЯЗЫК(article.language) || "en";
      const localeHref = (c) =>
        c === оригинал ? newsBase : `${newsBase}?locale=${c}`;

      /* Языки, у которых ЕСТЬ собственный текст: оригинал плюс готовые
         переводы. Здесь стоял зашитый список из пяти локалей, а переводов
         новостей в системе нет ни одного — у всех записей
         translationStatus: pending и пустое translations (проверено
         выборкой: 20 из 20, оригинал английский у всех). Пять объявленных
         версий вели на один и тот же английский текст: поисковик получал
         пять почти одинаковых страниц вместо одной, а человек приходил по
         русскому запросу на английскую статью. Объявить перевод, которого
         нет, хуже, чем не объявлять ничего.

         Появятся переводы — разметка появится сама: движок кладёт их в то
         же поле translations. */
      const переводы =
        article.translations && typeof article.translations === "object"
          ? Object.keys(article.translations).filter(
              (c) => ЯЗЫК(c) && article.translations[c],
            )
          : [];
      const языки = [...new Set([оригинал, ...переводы])];

      /* Канонический адрес — язык, который РЕАЛЬНО отдан. Просят локаль
         без перевода, сервер возвращает оригинал, и адрес с ?locale= для
         него был бы вторым адресом того же самого текста. */
      pageUrl =
        urlLocale && языки.includes(urlLocale)
          ? localeHref(urlLocale)
          : newsBase;

      alternateLinks =
        языки.length > 1
          ? [
              `<link data-seo="edge" rel="alternate" hreflang="x-default" href="${newsBase}">`,
              ...языки.map(
                (c) =>
                  `<link data-seo="edge" rel="alternate" hreflang="${c}" href="${localeHref(c)}">`,
              ),
            ].join("\n    ")
          : "";
      publishedAt = article.publishedAt;
      modifiedAt = article.updatedAt || article.publishedAt;
      /* Картинка — СВОЯ, а не ссылка на сервер издания.
         Здесь стоял прямой адрес картинки с sciencedaily.com и statnews.com:
         каждое открытие и каждый шеринг грузили их сервер, а любой их
         403 превращал превью в пустоту. Своё изображение честнее: превью
         показывает нашу страницу, а не выдаёт чужую иллюстрацию за нашу.
         Вернуть картинку издания можно, но не ссылкой — перезаливом в R2,
         это работа движка, а не отдающего HTML. */
      imageUrl = "https://docpats.com/og-image.jpg";
      bodyText = toText(
        article.aiSummary || article.content || article.summary || "",
        6000,
      );
    } else if (doctorArticleMatch) {
      const articleId = doctorArticleMatch[1];
      locale = "ru";
      schemaType = "MedicalScholarlyArticle";

      const res = await fetch(
        `https://backend.docpats.com/doctor-profile/my-article-single/${articleId}`,
      );
      if (!res.ok) return нетМатериала(res, context);
      const data = await res.json();
      const article = data?.data;
      if (!article) return отдать404(context);

      title = (article.title || "").replace(/"/g, "&quot;");
      desc = краткоеОписание(
        article.metaDescription || article.abstract || "",
      ).replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/public/doctor-profile/article-detail-for-all/${articleId}`;
      publishedAt = article.createdAt;
      modifiedAt = article.updatedAt || article.createdAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-image.jpg";
      // Только текстом: HTML из редактора здесь не санитизируется.
      bodyText = toText(article.abstract || article.content || "", 6000);
    } else if (scientificArticleMatch) {
      const articleId = scientificArticleMatch[1];
      locale = "ru";
      schemaType = "ScholarlyArticle";

      const res = await fetch(
        `https://backend.docpats.com/doctor-profile/my-article-scientific-single/${articleId}`,
      );
      if (!res.ok) return нетМатериала(res, context);
      const data = await res.json();
      const article = data?.data;
      if (!article) return отдать404(context);

      title = (article.title || "").replace(/"/g, "&quot;");
      desc = краткоеОписание(
        article.metaDescription || article.abstract || "",
      ).replace(/"/g, "&quot;");
      pageUrl = `https://docpats.com/public/doctor/article-scientific-detail-for-all/${articleId}`;
      publishedAt = article.createdAt;
      modifiedAt = article.updatedAt || article.createdAt;
      imageUrl = article.imageUrl || "https://docpats.com/og-image.jpg";
      // Аннотация и тело — текстом: HTML из редактора не санитизируется.
      bodyText = toText(
        [article.abstract, article.content].filter(Boolean).join(" "),
        6000,
      );
    } else if (doctorProfileMatch) {
      const doctorId = doctorProfileMatch[1];
      locale = "ru";
      schemaType = "Physician";

      const res = await fetch(
        `https://backend.docpats.com/doctor-profile/doctor-detail/${doctorId}`,
      );
      if (!res.ok) return нетМатериала(res, context);
      const data = await res.json();
      const doctor = data;
      if (!doctor) return отдать404(context);

      const firstName = doctor.user?.firstName || "";
      const lastName = doctor.user?.lastName || "";
      const fullName = `Dr. ${firstName} ${lastName}`.trim();
      const specName =
        doctor.user?.specializationName ||
        doctor.user?.specialization?.name ||
        "";

      medicalSpecialty = specName || undefined;
      title = `${fullName} — ${specName} | DocPats`.replace(/"/g, "&quot;");
      desc = краткоеОписание(
        doctor.about || `Профиль врача ${fullName}, специальность: ${specName}`,
      ).replace(/"/g, "&quot;");
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

    if (videoMatch) {
      const videoId = videoMatch[1];
      const cookieHeader = request.headers.get("cookie") || "";
      locale = cookieHeader.match(/locale=([a-z]{2})/)?.[1] || "ru";
      schemaType = "VideoObject";

      const res = await fetch(
        `https://backend.docpats.com/api/v1/video/public/${videoId}`,
      );
      // Закрытый, снятый с публикации или несуществующий ролик — обычный
      // путь SPA: она покажет «ролик недоступен», а бот не получит карточку
      // на то, чего нет.
      if (!res.ok) return нетМатериала(res, context);
      // Ответ обёрнут: { video: {...} }. Разбираем обе формы — обёртка
      // дешёвая, а молчаливый промах здесь виден только в чужой ленте.
      const тело = await res.json();
      const video = тело?.video || тело;
      if (!video?.title) return отдать404(context);

      title = String(video.title).replace(/"/g, "&quot;").replace(/\n/g, " ").trim();
      // Без описания берём название: пустой текст в ленте выглядит как
      // сломанная карточка, а не как ролик без описания.
      desc = краткоеОписание(video.description || video.title || "").replace(
        /"/g,
        "&quot;",
      );
      pageUrl = `https://docpats.com/videos/${videoId}`;
      publishedAt = video.publishedAt;
      modifiedAt = video.publishedAt;
      // Кадр ролика собирает сервер: адрес хранилища знает только он.
      imageUrl = video.posterUrl || "https://docpats.com/og-image.jpg";
      embedUrl = `https://docpats.com/embed/${videoId}`;

      const сек = Math.round(Number(video.media?.durationSec) || 0);
      if (сек > 0) {
        videoDuration = `PT${Math.floor(сек / 60)}M${сек % 60}S`;
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
    <meta data-seo="edge" property="og:type" content="${
      schemaType === "Physician"
        ? "profile"
        : schemaType === "VideoObject"
          ? "video.other"
          : "article"
    }">
    <meta data-seo="edge" property="og:title" content="${title}">
    <meta data-seo="edge" property="og:description" content="${desc}">
    <meta data-seo="edge" property="og:url" content="${pageUrl}">
    <meta data-seo="edge" property="og:image" content="${imageUrl}">
    <meta data-seo="edge" property="og:locale" content="${locale}">
    ${
      schemaType === "VideoObject"
        ? `<meta data-seo="edge" property="og:video" content="${embedUrl}">
    <meta data-seo="edge" property="og:video:url" content="${embedUrl}">
    <meta data-seo="edge" property="og:video:secure_url" content="${embedUrl}">
    <meta data-seo="edge" property="og:video:type" content="text/html">
    <meta data-seo="edge" property="og:video:width" content="1280">
    <meta data-seo="edge" property="og:video:height" content="720">
    <meta data-seo="edge" property="og:image:width" content="1280">
    <meta data-seo="edge" property="og:image:height" content="720">`
        : ""
    }
    <meta data-seo="edge" name="twitter:card" content="${
      schemaType === "VideoObject" ? "player" : "summary_large_image"
    }">
    ${
      schemaType === "VideoObject"
        ? `<meta data-seo="edge" name="twitter:player" content="${embedUrl}">
    <meta data-seo="edge" name="twitter:player:width" content="1280">
    <meta data-seo="edge" name="twitter:player:height" content="720">`
        : ""
    }
    <meta data-seo="edge" name="twitter:title" content="${title}">
    <meta data-seo="edge" name="twitter:description" content="${desc}">
    <meta data-seo="edge" name="twitter:image" content="${imageUrl}">
    <script type="application/ld+json" data-seo="edge">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": schemaType,
      headline:
        schemaType !== "Physician" && schemaType !== "VideoObject"
          ? title
          : undefined,
      name:
        schemaType === "Physician" || schemaType === "VideoObject"
          ? title
          : undefined,
      // VideoObject требует своих полей: без thumbnailUrl и uploadDate
      // Google не берёт ролик в видео-блок выдачи вовсе.
      thumbnailUrl: schemaType === "VideoObject" ? imageUrl : undefined,
      uploadDate:
        schemaType === "VideoObject" ? publishedAt || undefined : undefined,
      duration: schemaType === "VideoObject" ? videoDuration : undefined,
      embedUrl: schemaType === "VideoObject" ? embedUrl : undefined,
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
        schemaType === "Physician"
          ? undefined
          : издательМатериала || {
              "@type": "Organization",
              name: "DocPats",
              url: "https://docpats.com",
            },
      /* Связь с первоисточником. isBasedOn — «сделано на основе», sameAs —
         «то же самое в другом месте»: вместе они говорят поисковику, что
         оригинал вон там, и наша страница на его место не претендует. */
      isBasedOn: основаноНа || undefined,
      sameAs: основаноНа || undefined,
    })}</script>`;

    if (noIndex) {
      // Свой тег вместо унаследованного «index, follow» из оболочки.
      html = html.replace(
        /<meta[^>]+name="robots"[^>]*>/i,
        '<meta name="robots" content="noindex, follow" data-seo="edge">',
      );
      if (!/name="robots"/i.test(html)) {
        html = html.replace(
          "</head>",
          '<meta name="robots" content="noindex, follow" data-seo="edge"></head>',
        );
      }
    }

    html = html.replace("</head>", inject + "</head>");

    /* Содержимое для тех, кто не выполняет JS: заголовок, лид и текст
       материала. До этого в сыром HTML у статьи не было ни одного слова —
       краулеры языковых моделей и Bing видели пустой контейнер. */
    html = injectBody(html, [
      tag("h1", title),
      tag("p", desc),
      bodyText ? tag("div", bodyText) : "",
      link("/articles", "Все научные статьи"),
      link("/news", "Лента медицинских новостей"),
    ]);

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return context.next();
  }
}

/* ── Ничего не подошло: адрес приложению незнаком ─────────────────────
 *
 * Сюда запрос доходит, пройдя мимо всех веток: это не материал, не
 * витрина, не раздел. Если первый сегмент адреса не принадлежит ни одной
 * зоне приложения — страницы нет, и сказать об этом надо статусом.
 */

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

/**
 * Ответ «страницы нет» — со статусом 404 и оболочкой приложения.
 *
 * Отдаём именно оболочку, а не голый текст: человек должен попасть на
 * привычную страницу с шапкой и навигацией, а не в тупик. Статус при этом
 * честный — по нему поисковик выбрасывает адрес из очереди обхода.
 */
/* Материал не отдался — отвечаем по причине отказа.
 *
 * API сказал «нет такого» (404/410) — страницы нет, и это 404. API не
 * ответил или сломался — страница, возможно, жива, и объявлять её
 * удалённой из-за чужого сбоя нельзя: за время аварии поисковик выбросит
 * из индекса работающий раздел. Тогда прежний проход: приложение
 * отрисует что сможет.
 */
function нетМатериала(res, context) {
  return res.status === 404 || res.status === 410
    ? отдать404(context)
    : context.next();
}

async function отдать404(context) {
  const response = await context.next();
  let html = await response.text();

  /* Оболочка объявляет себя индексируемой — на несуществующем адресе это
     противоречит статусу. Статус робот слушает, но оставлять в теле
     «index, follow» незачем: заодно меняем заголовок вкладки, иначе
     человек видит в ней название платформы вместо ответа на вопрос,
     куда он попал. */
  html = html
    .replace(
      /<meta\s+name="robots"[^>]*>/i,
      '<meta name="robots" content="noindex, follow" data-seo="edge">',
    )
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      "<title>Страница не найдена — DocPats</title>",
    );

  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * Описание для сниппета: обрезаем по границе предложения, а не по счётчику
 * символов.
 *
 * Резать ровно на 155-м знаке — значит регулярно обрывать слово посередине:
 * «including» превращается в «inclu» и в таком виде уходит в выдачу и в
 * превью мессенджера. Ищем конец предложения в последней трети отрезка,
 * иначе — последний пробел; многоточие ставим только там, где текст
 * действительно оборван.
 */
function краткоеОписание(текст, предел = 160) {
  const t = String(текст || "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= предел) return t;

  const кусок = t.slice(0, предел);

  // Конец предложения: точка, «!», «?» — с пробелом или в самом конце.
  const предложение = кусок.search(/[.!?](?=\s|$)(?![\s\S]*[.!?](?=\s|$))/);
  if (предложение >= предел * 0.6) return кусок.slice(0, предложение + 1);

  const пробел = кусок.lastIndexOf(" ");
  return (пробел > 0 ? кусок.slice(0, пробел) : кусок).replace(/[,;:]$/, "") + "…";
}

/** Код языка платформы — или null, если это не он. */
function ЯЗЫК(код) {
  const c = String(код || "")
    .slice(0, 2)
    .toLowerCase();
  return ["ru", "en", "az", "tr", "ar"].includes(c) ? c : null;
}

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
    // Разделы-списки: до них edge не доходила, и каждый отдавал общий
    // title оболочки с canonical на главную.
    "/news",
    "/articles",
    "/videos",
    "/pricing",
    "/conferences",
    "/education",
    // Четыре раздела, до которых edge не доходила вовсе: каждый отдавал
    // общий заголовок оболочки вместо своего названия.
    "/about",
    "/demo",
    "/top-doctors",
    "/docs",
    "/docs/*",
    "/articles/*",
    "/news/*",
    "/clinics/*",
    "/public/doctor-profile/article-detail-for-all/*",
    "/public/doctor/article-scientific-detail-for-all/*",
    "/public/doctor-profile/doctor-details/*",
    // Ролик каталога. Адрес двухсегментный и под "/:slug" не попадает:
    // без этой строки ветка роликов написана, но не вызывается,
    // и ссылка в ленте показывает общую заставку платформы.
    "/videos/*",
    // Витрина по корневому слагу. Односегментный шаблон URLPattern: под него
    // попадает и /login, и /pricing — отсекаются они в RESERVED_ROOT, а всё
    // незнакомое проверяется запросом к публичному API.
    "/:slug",
    /* Шаблона "/*" здесь БОЛЬШЕ НЕТ.
     *
     * Он стоял ради 404 на незнакомых адресах, но означал вызов функции
     * НА КАЖДЫЙ адрес сайта — включая каждый экран кабинета, где ей
     * делать нечего: она доходила до конца веток и молча пропускала
     * запрос дальше. Каждый вызов платный, и счётчик Netlify выбило —
     * сайт целиком начал отвечать 503 usage_exceeded.
     *
     * Ту же работу делают правила CDN, бесплатно: известная зона отдаёт
     * оболочку с 200, всё прочее — её же со статусом 404. Список зон
     * генерируется из public-routes.js (scripts/generate-redirects.cjs),
     * так что второго списка руками никто не ведёт.
     *
     * Функция остаётся там, где действительно нужна: материалы, витрины,
     * разделы — то есть где надо подставить title, canonical и разметку.
     */
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
    // Статика и служебные пути: у файлов свой отдающий и свой статус.
    "/static/*",
    "/assets/*",
    "/locales/*",
    "/uploads/*",
    "/docs/*/*",
    "/.netlify/*",
    "/cdn-cgi/*",
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
