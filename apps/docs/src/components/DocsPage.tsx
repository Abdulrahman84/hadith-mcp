import Link from "next/link";
import type { Locale } from "../content/site";
import { content } from "../content/site";

const command = `npm install
npm run build
npm run build:meeatif-sqlite

HADITH_MCP_DB_PATH=data/generated/hadith-meeatif.sqlite \\
node packages/hadith-mcp/dist/cli.js`;

const config = `{
  "mcpServers": {
    "hadith-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/hadith-mcp/packages/hadith-mcp/dist/cli.js"],
      "env": {
        "HADITH_MCP_DB_PATH": "/absolute/path/to/hadith-mcp/data/generated/hadith-meeatif.sqlite"
      }
    }
  }
}`;

export function DocsPage({ locale }: { locale: Locale }) {
  const t = content[locale];
  const otherLocale = locale === "en" ? "ar" : "en";
  const homeHref = locale === "ar" ? "/" : "/en";
  const alternateHref = otherLocale === "ar" ? "/" : "/en";

  return (
    <div
      lang={locale}
      dir={t.dir}
      className="min-h-screen bg-[#f7f4ec] text-[#172322]"
      style={{
        fontFamily:
          locale === "ar"
            ? "Tahoma, Arial, ui-sans-serif, system-ui, sans-serif"
            : "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      <header className="sticky top-0 z-30 border-b border-[#243b37]/15 bg-[#fbfaf5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <Link href={homeHref} className="flex items-center gap-3 no-underline">
            <img src="/assets/hadith-mcp-mark.svg" alt="" className="h-9 w-9" />
            <span>
              <strong className="block text-sm font-black">Hadith MCP</strong>
              <small className="block text-xs text-[#73543a]">
                {locale === "ar" ? "مصدر موثق للسنّة" : "Sunnah source layer"}
              </small>
            </span>
          </Link>
          <nav className="flex gap-4 overflow-x-auto text-sm font-bold text-[#243b37]/70">
            <a href={`${homeHref}#overview`}>{t.nav.overview}</a>
            <a href={`${homeHref}#issue`}>{t.nav.issue}</a>
            <a href={`${homeHref}#tools`}>{t.nav.tools}</a>
            <a href={`${homeHref}#data`}>{t.nav.data}</a>
            <a href={`${homeHref}#setup`}>{t.nav.setup}</a>
            <a href={`${homeHref}#policy`}>{t.nav.policy}</a>
            <Link href={alternateHref} className="border border-[#243b37]/20 px-3 py-1 text-[#243b37]">
              {t.alternate}
            </Link>
          </nav>
        </div>
      </header>

      <main id="overview">
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-16">
          <div className="border-y border-[#243b37]/20 py-8">
            <p className="mb-5 text-xs font-black uppercase text-[#76512f]">{t.hero.eyebrow}</p>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-normal text-[#172322] md:text-5xl">
              {t.hero.title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[#172322]/72 md:text-lg">{t.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#setup" className="border border-[#172322] bg-[#172322] px-4 py-2.5 text-sm font-black text-[#fbfaf5]">
                {t.hero.primary}
              </a>
              <a href="#tools" className="border border-[#172322]/25 px-4 py-2.5 text-sm font-black text-[#172322]">
                {t.hero.secondary}
              </a>
            </div>
            <p className="mt-8 max-w-2xl border-s-2 border-[#9f6b3d] ps-4 text-sm leading-7 text-[#172322]/65">{t.hero.note}</p>
          </div>

          <aside className="self-start border border-[#243b37]/20 bg-[#fffdf8]">
            <div className="border-b border-[#243b37]/15 p-5">
              <div className="mb-5 flex items-center gap-3">
                <img src="/assets/hadith-mcp-mark.svg" alt="" className="h-11 w-11" />
                <div>
                  <strong className="block text-base">{locale === "ar" ? "تشغيل محلي" : "Local run"}</strong>
                  <span className="text-sm text-[#172322]/60">
                    {locale === "ar" ? "قاعدة بيانات (SQLite) + خادم (MCP)" : "SQLite database + MCP server"}
                  </span>
                </div>
              </div>
              <dl className="grid gap-px overflow-hidden border border-[#243b37]/15 bg-[#243b37]/15">
                {t.metrics.map(([value, label]) => (
                  <div key={label} className="grid grid-cols-[110px_1fr] bg-[#fffdf8] px-3 py-2">
                    <dt className="font-black text-[#315f55]">{value}</dt>
                    <dd className="text-sm text-[#172322]/65">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <EnvNote locale={locale} />
          </aside>
        </section>

        <TextTableSection id="issue" eyebrow={t.issue.eyebrow} title={t.issue.title} body={t.issue.body} rows={t.issue.items} />

        <TextTableSection
          id="tools"
          eyebrow={t.toolsIntro.eyebrow}
          title={t.toolsIntro.title}
          body={t.toolsIntro.body}
          rows={t.tools}
          codeFirst
        />

        <DataSection content={t.data} />

        <section id="setup" className="border-y border-[#172322]/90 bg-[#172322] text-[#fbfaf5]">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[320px_1fr]">
            <div>
              <SectionEyebrow dark>{t.setup.eyebrow}</SectionEyebrow>
              <h2 className="text-3xl font-black leading-tight md:text-4xl">{t.setup.title}</h2>
              <p className="mt-5 leading-8 text-white/68">{t.setup.body}</p>
            </div>
            <div className="grid gap-4">
              <CodeBlock label={t.setup.commandLabel} code={command} />
              <CodeBlock label={t.setup.configLabel} code={config} />
            </div>
          </div>
        </section>

        <TextTableSection id="policy" eyebrow={t.policy.eyebrow} title={t.policy.title} body={t.policy.body} rows={t.policy.items} />
      </main>

      <footer className="border-t border-[#243b37]/15 bg-[#fbfaf5] px-5 py-7">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 text-sm text-[#172322]/62 md:flex-row">
          <span>Hadith MCP</span>
          <span>{t.footer}</span>
        </div>
      </footer>
    </div>
  );
}

function EnvNote({ locale }: { locale: Locale }) {
  return (
    <div className="bg-[#223631] p-5 text-[#fbfaf5]">
      <code className="text-sm text-[#e1b66b]">HADITH_MCP_DB_PATH</code>
      <p className="mt-3 text-sm leading-6 text-white/70">
        {locale === "ar"
          ? "متغير البيئة (environment variable) الذي يحدد ملف قاعدة البيانات (SQLite)."
          : "The environment variable that switches the server from fixture mode to the local SQLite database."}
      </p>
    </div>
  );
}

function SectionEyebrow({ children, dark = false }: { children: string; dark?: boolean }) {
  return <p className={`mb-3 text-xs font-black uppercase ${dark ? "text-[#e1b66b]" : "text-[#76512f]"}`}>{children}</p>;
}

function TextTableSection({
  id,
  eyebrow,
  title,
  body,
  rows,
  codeFirst = false
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  rows: [string, string][];
  codeFirst?: boolean;
}) {
  return (
    <section id={id} className="border-t border-[#243b37]/15">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[320px_1fr]">
        <div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h2 className="text-3xl font-black leading-tight text-[#172322] md:text-4xl">{title}</h2>
          <p className="mt-5 leading-8 text-[#172322]/68">{body}</p>
        </div>
        <div className="overflow-hidden border border-[#243b37]/15 bg-[#fffdf8]">
          {rows.map(([term, description]) => (
            <div key={term} className="grid gap-2 border-b border-[#243b37]/12 p-4 last:border-b-0 md:grid-cols-[230px_1fr]">
              {codeFirst ? (
                <code className="break-words text-sm font-black text-[#7e4b32]">{term}</code>
              ) : (
                <strong className="text-base font-black text-[#315f55]">{term}</strong>
              )}
              <p className="m-0 text-sm leading-7 text-[#172322]/72">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataSection({ content: data }: { content: (typeof content)["en"]["data"] }) {
  return (
    <section id="data" className="border-t border-[#243b37]/15 bg-[#fbfaf5]">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[320px_1fr]">
        <div>
          <SectionEyebrow>{data.eyebrow}</SectionEyebrow>
          <h2 className="text-3xl font-black leading-tight text-[#172322] md:text-4xl">{data.title}</h2>
          <p className="mt-5 leading-8 text-[#172322]/68">{data.body}</p>
        </div>
        <div className="overflow-hidden border border-[#243b37]/15 bg-[#fffdf8]">
          {data.rows.map(([label, value, text]) => (
            <div key={label} className="grid gap-2 border-b border-[#243b37]/12 p-4 last:border-b-0 md:grid-cols-[130px_160px_1fr]">
              <span className="text-xs font-black uppercase text-[#76512f]">{label}</span>
              <strong className="text-base font-black text-[#315f55]">{value}</strong>
              <p className="m-0 text-sm leading-7 text-[#172322]/72">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden border border-white/15 bg-[#07161c]">
      <div className="border-b border-white/10 px-4 py-2 text-xs font-black uppercase text-[#e1b66b]">{label}</div>
      <pre className="m-0 overflow-auto p-4 text-sm leading-7 text-[#e8f3ed]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
