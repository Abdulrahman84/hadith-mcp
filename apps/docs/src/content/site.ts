export type Locale = "en" | "ar";

type SiteContent = {
  dir: "ltr" | "rtl";
  langName: string;
  alternate: string;
  nav: {
    overview: string;
    tools: string;
    data: string;
    setup: string;
    policy: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
    note: string;
  };
  metrics: [string, string][];
  toolsIntro: {
    eyebrow: string;
    title: string;
    body: string;
  };
  tools: [string, string][];
  data: {
    eyebrow: string;
    title: string;
    body: string;
    rows: [string, string, string][];
  };
  setup: {
    eyebrow: string;
    title: string;
    body: string;
    commandLabel: string;
    configLabel: string;
  };
  policy: {
    eyebrow: string;
    title: string;
    body: string;
    items: [string, string][];
  };
  footer: string;
};

export const content: Record<Locale, SiteContent> = {
  en: {
    dir: "ltr",
    langName: "English",
    alternate: "العربية",
    nav: {
      overview: "Overview",
      tools: "Tools",
      data: "Data",
      setup: "Setup",
      policy: "Policy"
    },
    hero: {
      eyebrow: "Hadith MCP / local source layer",
      title: "Sunnah retrieval with citations, not guesswork.",
      subtitle:
        "A TypeScript MCP server for exact hadith lookup, Arabic and English search, source-attributed grades, and auditable SQLite provenance.",
      primary: "Run locally",
      secondary: "Read the tools",
      note: "V1 is MCP-first. The public Quran/Hadith assistant belongs in a separate repository."
    },
    metrics: [
      ["33,736", "imported rows"],
      ["Six Books", "initial scope"],
      ["18,054", "attributed grades"],
      ["0", "SQLite validation warnings"]
    ],
    toolsIntro: {
      eyebrow: "Tool surface",
      title: "Six read-only calls for AI clients.",
      body:
        "The server returns structured source records and provenance notes. It does not issue rulings, infer grades, or generate religious interpretation."
    },
    tools: [
      ["list_collections", "Collection ids, display names, language coverage, and dataset name."],
      ["fetch_hadith", "Exact lookup by in-book id, collection-prefixed reference, or source URL."],
      ["search_hadith", "SQLite FTS5 snippets over Arabic and English text."],
      ["validate_hadith_reference", "Alias resolution, canonical ids, and suggestions for misses."],
      ["get_hadith_metadata", "Book, chapter, numbering, source version, and provenance notes."],
      ["get_hadith_grade", "Attributed grades only; otherwise an explicit grade: null."]
    ],
    data: {
      eyebrow: "Data posture",
      title: "The database is local. The provenance is explicit.",
      body:
        "The current candidate import uses meeAtif/hadith_datasets after owner acceptance of source-chain risk for local v1 work. Generated SQLite data remains separate from the MIT code license.",
      rows: [
        ["Coverage", "Six Books", "Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, and Ibn Majah."],
        ["Warnings", "15,685", "Mostly missing grades, one missing English row, and two skipped references."],
        ["Grade sources", "Darussalam / Al-Albani", "Returned only where the imported source attributes them."]
      ]
    },
    setup: {
      eyebrow: "Local setup",
      title: "Build the SQLite file, then point your MCP client at the CLI.",
      body:
        "The examples use absolute paths for client configs. Without HADITH_MCP_DB_PATH, the server starts in fixture mode for schema tests only.",
      commandLabel: "Terminal",
      configLabel: "MCP config shape"
    },
    policy: {
      eyebrow: "Boundary",
      title: "A source layer, not a mufti.",
      body:
        "Client prompts should preserve citations and missing provenance. Search results must not be converted into fatwas or scholarly adjudication.",
      items: [
        ["Cite every text", "Collection, hadith number, source dataset, and source reference travel together."],
        ["Keep grades attributed", "No model-generated grades and no collection-level assumptions."],
        ["Expose gaps", "Missing English, missing grades, skipped rows, and source-chain notes remain visible."],
        ["Keep products separate", "Quran/Tafsir orchestration and answer synthesis live outside this repo."]
      ]
    },
    footer: "Read-only cited retrieval for the Sunnah."
  },
  ar: {
    dir: "rtl",
    langName: "العربية",
    alternate: "English",
    nav: {
      overview: "نظرة عامة",
      tools: "الأدوات",
      data: "البيانات",
      setup: "التشغيل",
      policy: "الحدود"
    },
    hero: {
      eyebrow: "Hadith MCP / طبقة مصادر محلية",
      title: "استرجاع السنة بإحالات واضحة لا بتخمين النموذج.",
      subtitle:
        "خادم MCP مبني بـ TypeScript للبحث والاسترجاع الدقيق في الحديث، مع العربية والإنجليزية، والدرجات المنسوبة لمصدرها، وسجل SQLite قابل للمراجعة.",
      primary: "شغله محليا",
      secondary: "اقرأ الأدوات",
      note: "الإصدار الأول MCP أولا. المنتج العام للقرآن والحديث سيكون في مستودع مستقل."
    },
    metrics: [
      ["33,736", "صفا مستوردا"],
      ["الكتب الستة", "نطاق البداية"],
      ["18,054", "درجة منسوبة"],
      ["0", "تحذيرات تحقق SQLite"]
    ],
    toolsIntro: {
      eyebrow: "واجهة الأدوات",
      title: "ست نداءات قراءة فقط لعملاء الذكاء الاصطناعي.",
      body:
        "يعيد الخادم سجلات مصدرية منظمة وملاحظات توثيق. لا يصدر أحكاما، ولا يستنتج الدرجات، ولا يولد تفسيرا دينيا."
    },
    tools: [
      ["list_collections", "معرفات المجموعات، الأسماء، تغطية اللغات، واسم مجموعة البيانات."],
      ["fetch_hadith", "استرجاع دقيق بالرقم الداخلي أو مرجع مع اسم المجموعة أو رابط المصدر."],
      ["search_hadith", "مقاطع بحث SQLite FTS5 في النص العربي والإنجليزي."],
      ["validate_hadith_reference", "تطبيع الأسماء، إرجاع المعرف القانوني، واقتراحات عند عدم المطابقة."],
      ["get_hadith_metadata", "الكتاب، الباب، الترقيم، إصدار المصدر، وملاحظات التوثيق."],
      ["get_hadith_grade", "الدرجات المنسوبة فقط، وإلا يعاد grade: null صراحة."]
    ],
    data: {
      eyebrow: "سياسة البيانات",
      title: "قاعدة البيانات محلية، والتوثيق ظاهر.",
      body:
        "مسار البيانات الحالي يستخدم meeAtif/hadith_datasets بعد قبول مالك المشروع لمخاطر سلسلة المصدر في عمل v1 المحلي. ملفات SQLite المولدة منفصلة عن رخصة كود MIT.",
      rows: [
        ["التغطية", "الكتب الستة", "البخاري، مسلم، أبو داود، الترمذي، النسائي، وابن ماجه."],
        ["التحذيرات", "15,685", "أغلبها درجات مفقودة، مع صف إنجليزي مفقود ومرجعين تم تخطيهما."],
        ["مصادر الدرجات", "Darussalam / Al-Albani", "تعاد فقط عندما ينسبها المصدر المستورد."]
      ]
    },
    setup: {
      eyebrow: "التشغيل المحلي",
      title: "ابن ملف SQLite ثم وجه عميل MCP إلى واجهة التشغيل.",
      body:
        "أمثلة الإعداد تستخدم مسارات مطلقة. من دون HADITH_MCP_DB_PATH يبدأ الخادم بوضع العينات الاختبارية فقط.",
      commandLabel: "الطرفية",
      configLabel: "شكل إعداد MCP"
    },
    policy: {
      eyebrow: "الحدود",
      title: "طبقة مصادر، لا جهة فتوى.",
      body:
        "ينبغي لرسائل العميل الحفاظ على الإحالات وبيان نقص التوثيق. لا تتحول نتائج البحث إلى فتاوى أو ترجيحات علمية.",
      items: [
        ["كل نص بإحالته", "المجموعة، رقم الحديث، مجموعة البيانات، ومرجع المصدر تعاد معا."],
        ["الدرجات منسوبة", "لا درجات مولدة بالنموذج ولا افتراضات من اسم الكتاب."],
        ["أظهر الفجوات", "نقص الإنجليزية والدرجات والصفوف المتخطاة وملاحظات المصدر تبقى ظاهرة."],
        ["افصل المنتج النهائي", "تنسيق القرآن والتفسير وصياغة الأجوبة خارج هذا المستودع."]
      ]
    },
    footer: "استرجاع موثق للسنّة، للقراءة فقط."
  }
};
