export type Locale = "en" | "ar";

type SiteContent = {
  dir: "ltr" | "rtl";
  langName: string;
  alternate: string;
  nav: {
    overview: string;
    issue: string;
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
  issue: {
    eyebrow: string;
    title: string;
    body: string;
    items: [string, string][];
  };
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
      issue: "Issue",
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
      ["Local", "SQLite build"]
    ],
    issue: {
      eyebrow: "The issue",
      title: "AI agents need hadith text they can verify.",
      body:
        "General chat models can sound confident while mixing references, grades, translations, and missing provenance. Hadith MCP gives builders a narrow retrieval layer that returns source records before any answer is written.",
      items: [
        ["The source gets blurred", "Agents often receive a quote without the exact collection, hadith number, dataset, or source reference."],
        ["MCP answer: citations", "Every lookup returns structured citations and provenance fields alongside the text."],
        ["Grades get guessed", "When a grade is missing, the system must say so instead of filling the gap."],
        ["MCP answer: grades", "Grades are returned only when the imported source attributes them; otherwise the value is grade: null."]
      ]
    },
    toolsIntro: {
      eyebrow: "Tool surface",
      title: "Six read-only calls for AI Agents.",
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
        ["Provenance", "Explicit fields", "Collection, hadith number, dataset name, source URL, and import notes stay attached."],
        ["Licensing", "Separated", "Generated data and import reports are not covered by the MIT code license."]
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
      issue: "المشكلة",
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
      ["محلي", "بناء (SQLite)"]
    ],
    issue: {
      eyebrow: "المشكلة",
      title: "عملاء الذكاء الاصطناعي يحتاجون نصا حديثيا يمكن التحقق منه.",
      body:
        "النماذج العامة قد تبدو واثقة، لكنها تخلط أحيانا بين المرجع والدرجة والترجمة ونقص التوثيق. لذلك يقدّم Hadith MCP طبقة استرجاع (retrieval layer) ضيقة تعيد سجل المصدر قبل صياغة أي جواب.",
      items: [
        ["المصدر قد يختلط", "قد يصل للعميل نص بلا اسم الكتاب، أو رقم الحديث، أو اسم مجموعة البيانات (dataset)، أو مرجع المصدر."],
        ["حل (MCP): الإحالات", "كل عملية استرجاع تعيد النص مع الإحالات وحقول التوثيق (provenance) في بنية واضحة."],
        ["الدرجات قد تُخمن", "عند غياب الدرجة يجب أن يظهر النقص صراحة، لا أن يملأه النموذج (model)."],
        ["حل (MCP): الدرجات", "لا يعرض الخادم الدرجة إلا إذا نسبها المصدر المستورد، وإلا يعيد (grade: null)."]
      ]
    },
    toolsIntro: {
      eyebrow: "واجهة الأدوات",
      title: "ست أدوات قراءة فقط لعملاء الذكاء الاصطناعي (AI Agents).",
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
        ["التوثيق", "حقول واضحة", "اسم الكتاب، ورقم الحديث، واسم مجموعة البيانات (dataset)، ورابط المصدر، وملاحظات الاستيراد تبقى مرفقة."],
        ["الترخيص", "فصل واضح", "البيانات المولدة وتقارير الاستيراد ليست ضمن رخصة كود (MIT)."]
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
