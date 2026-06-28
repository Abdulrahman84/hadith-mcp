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
      note: "Runs locally and returns citations, source references, and provenance notes with every record."
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
        "The local candidate build uses meeAtif/hadith_datasets. The generated database and its import report stay separate from the MIT code license.",
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
        "Build once, then use absolute paths in your MCP client configuration. HADITH_MCP_DB_PATH tells the server which SQLite file to read.",
      commandLabel: "Terminal",
      configLabel: "MCP config shape"
    },
    policy: {
      eyebrow: "Boundary",
      title: "A source layer, not an authority.",
      body:
        "Client prompts should preserve citations and missing provenance. The server returns cited records; interpretation belongs outside this package.",
      items: [
        ["Cite every text", "Collection, hadith number, source dataset, and source reference travel together."],
        ["Keep grades attributed", "No model-generated grades and no collection-level assumptions."],
        ["Expose gaps", "Missing English, missing grades, skipped rows, and source-chain notes remain visible."],
        ["Keep answers grounded", "Clients should answer from retrieved records, not from model memory."]
      ]
    },
    footer: "Read-only cited retrieval for the Sunnah."
  },
  ar: {
    dir: "rtl",
    langName: "العربية",
    alternate: "English",
    nav: {
      overview: "الرئيسية",
      tools: "الأدوات",
      data: "البيانات",
      setup: "التشغيل",
      policy: "الضوابط"
    },
    hero: {
      eyebrow: "Hadith MCP / طبقة مصادر محلية (source layer)",
      title: "استرجاع نصوص السنة بإحالات موثقة.",
      subtitle:
        "خادم (MCP) مبني بـ (TypeScript) للبحث في الحديث واسترجاعه بدقة، مع النص العربي والترجمة الإنجليزية عند توفرها، والدرجات المنسوبة إلى مصدرها، وقاعدة بيانات (SQLite) قابلة للمراجعة.",
      primary: "تشغيل محلي",
      secondary: "اقرأ الأدوات",
      note: "يعمل محليا، ويعيد مع كل نتيجة رقم الحديث ومرجع المصدر وملاحظات التوثيق."
    },
    metrics: [
      ["33,736", "صفوف مستوردة"],
      ["الكتب الستة", "نطاق البيانات"],
      ["18,054", "درجة منسوبة"],
      ["0", "تحذيرات تحقق (SQLite)"]
    ],
    toolsIntro: {
      eyebrow: "واجهة الأدوات",
      title: "ست أدوات قراءة فقط لعملاء الذكاء الاصطناعي (AI clients).",
      body:
        "يعيد الخادم سجلات منظمة من المصدر مع ملاحظات التوثيق. لا يصدر أحكاما، ولا يستنتج الدرجات، ولا يولد تفسيرا دينيا."
    },
    tools: [
      ["list_collections", "يعرض معرفات الكتب، والأسماء، وتغطية اللغات، واسم مجموعة البيانات (dataset)."],
      ["fetch_hadith", "يجلب الحديث برقم داخلي، أو مرجع مسبوق باسم الكتاب، أو رابط المصدر."],
      ["search_hadith", "يبحث في النص العربي والإنجليزي باستخدام فهرسة (SQLite FTS5)."],
      ["validate_hadith_reference", "يتحقق من المرجع، ويعيد الرقم المعتمد، ويقترح بدائل عند عدم وجود نتيجة."],
      ["get_hadith_metadata", "يعرض الكتاب، والباب، والترقيم، وإصدار المصدر، وملاحظات التوثيق."],
      ["get_hadith_grade", "يعرض الدرجة المنسوبة إلى مصدرها فقط، وإلا يعيد (grade: null)."]
    ],
    data: {
      eyebrow: "سياسة البيانات",
      title: "قاعدة البيانات محلية، والتوثيق واضح.",
      body:
        "يعتمد التشغيل المحلي على مجموعة بيانات (dataset) باسم meeAtif/hadith_datasets. ملف قاعدة البيانات (SQLite) وتقرير الاستيراد منفصلان عن رخصة الكود (MIT).",
      rows: [
        ["التغطية", "الكتب الستة", "البخاري، مسلم، أبو داود، الترمذي، النسائي، وابن ماجه."],
        ["التحذيرات", "15,685", "معظمها درجات غير موجودة، مع صف واحد بلا ترجمة إنجليزية ومرجعين لم ينجح استيرادهما."],
        ["مصادر الدرجات", "Darussalam / Al-Albani", "تعرض الدرجة فقط عندما تكون منسوبة في المصدر المستورد."]
      ]
    },
    setup: {
      eyebrow: "التشغيل المحلي",
      title: "أنشئ ملف قاعدة البيانات (SQLite)، ثم اربط عميل (MCP) بواجهة التشغيل (CLI).",
      body:
        "أنشئ البيانات مرة واحدة، ثم استخدم مسارا مطلقا في إعدادات العميل. المتغير (HADITH_MCP_DB_PATH) يحدد ملف قاعدة البيانات الذي يقرأه الخادم.",
      commandLabel: "الأوامر (Terminal)",
      configLabel: "إعدادات (MCP)"
    },
    policy: {
      eyebrow: "الضوابط",
      title: "طبقة مصادر، وليست جهة إفتاء.",
      body:
        "ينبغي للعميل أن يحافظ على الإحالات، وأن يبين نقص التوثيق عند وجوده. الخادم يعيد سجلات موثقة فقط، وأي تفسير أو ترجيح يبقى خارج هذه الحزمة.",
      items: [
        ["كل نص بإحالته", "اسم الكتاب، ورقم الحديث، ومجموعة البيانات (dataset)، ومرجع المصدر تعاد معا."],
        ["الدرجات منسوبة", "لا درجات مولدة بالنموذج (model)، ولا افتراضات من اسم الكتاب."],
        ["الفجوات ظاهرة", "نقص الترجمة أو الدرجة أو التوثيق يبقى واضحا في النتيجة."],
        ["الأجوبة مبنية على الاسترجاع", "ينبغي للعميل أن يجيب من السجلات المسترجعة لا من ذاكرة النموذج (model)."]
      ]
    },
    footer: "استرجاع موثق للسنّة، للقراءة فقط."
  }
};
