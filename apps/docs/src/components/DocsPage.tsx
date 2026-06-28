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
      className="min-h-screen bg-[#f4eddf] text-[#111c1d]"
      style={{
        fontFamily:
          locale === "ar"
            ? "Tahoma, Arial, ui-sans-serif, system-ui, sans-serif"
            : "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      }}
    >
      <header className="sticky top-0 z-30 border-b border-[#193d39]/15 bg-[#f8f2e8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href={homeHref} className="flex items-center gap-3 no-underline">
            <img src="/assets/hadith-mcp-mark.svg" alt="" className="h-11 w-11" />
            <span>
              <strong className="block text-base font-black">Hadith MCP</strong>
              <small className="block text-xs text-[#8a5b35]">{locale === "ar" ? "طبقة مصادر للسنّة" : "Sunnah source layer"}</small>
            </span>
          </Link>
          <nav className="flex gap-5 overflow-x-auto text-sm font-bold text-[#193d39]/75">
            <a href={`${homeHref}#overview`}>{t.nav.overview}</a>
            <a href={`${homeHref}#tools`}>{t.nav.tools}</a>
            <a href={`${homeHref}#data`}>{t.nav.data}</a>
            <a href={`${homeHref}#setup`}>{t.nav.setup}</a>
            <a href={`${homeHref}#policy`}>{t.nav.policy}</a>
            <Link href={alternateHref} className="rounded border border-[#193d39]/20 px-3 py-1 text-[#193d39]">
              {t.alternate}
            </Link>
          </nav>
        </div>
      </header>

      <main id="overview">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1fr_380px] lg:py-20">
          <div className="border-y border-[#193d39]/20 py-8">
            <p className="mb-5 text-xs font-black uppercase tracking-[0.16em] text-[#8a5b35]">{t.hero.eyebrow}</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-[#102d32] md:text-7xl">
              {t.hero.title}
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-[#111c1d]/70 md:text-xl">{t.hero.subtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#setup" className="rounded border border-[#102d32] bg-[#102d32] px-5 py-3 font-black text-[#fff8ed]">
                {t.hero.primary}
              </a>
              <a href="#tools" className="rounded border border-[#102d32]/25 px-5 py-3 font-black text-[#102d32]">
                {t.hero.secondary}
              </a>
            </div>
            <p className="mt-8 max-w-2xl border-s-4 border-[#c28b52] ps-4 text-sm leading-7 text-[#111c1d]/65">{t.hero.note}</p>
          </div>

          <aside className="grid content-start gap-3">
            <div className="rounded border border-[#193d39]/20 bg-[#fffaf0] p-5">
              <div className="mb-4 flex items-center gap-3">
                <img src="/assets/hadith-mcp-mark.svg" alt="" className="h-14 w-14" />
                <div>
                  <strong className="block text-lg">v1 local build</strong>
                  <span className="text-sm text-[#111c1d]/60">SQLite + stdio MCP</span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                {t.metrics.map(([value, label]) => (
                  <div key={label} className="border-t border-[#193d39]/15 pt-3">
                    <dt className="text-2xl font-black text-[#145c4f]">{value}</dt>
                    <dd className="text-sm text-[#111c1d]/65">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded border border-[#193d39]/20 bg-[#102d32] p-5 text-[#fff8ed]">
              <code className="text-sm text-[#d8b66d]">HADITH_MCP_DB_PATH</code>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {locale === "ar"
                  ? "متغير البيئة الذي ينقل الخادم من وضع العينات إلى قاعدة SQLite المحلية."
                  : "The environment variable that switches the server from fixture mode to the local SQLite database."}
              </p>
            </div>
          </aside>
        </section>

        <section id="tools" className="border-y border-[#193d39]/15 bg-[#fffaf0]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[360px_1fr]">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#8a5b35]">{t.toolsIntro.eyebrow}</p>
              <h2 className="text-4xl font-black leading-tight text-[#102d32] md:text-5xl">{t.toolsIntro.title}</h2>
              <p className="mt-5 leading-8 text-[#111c1d]/68">{t.toolsIntro.body}</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded border border-[#193d39]/15 bg-[#193d39]/15 md:grid-cols-2">
              {t.tools.map(([name, text]) => (
                <article key={name} className="bg-[#fffaf0] p-5">
                  <code className="break-words text-sm font-black text-[#9b623a]">{name}</code>
                  <p className="mt-3 text-sm leading-6 text-[#111c1d]/70">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="data" className="mx-auto max-w-7xl px-5 py-16">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#8a5b35]">{t.data.eyebrow}</p>
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-4xl font-black leading-tight text-[#102d32] md:text-5xl">{t.data.title}</h2>
              <p className="mt-5 leading-8 text-[#111c1d]/68">{t.data.body}</p>
            </div>
            <div className="grid gap-3">
              {t.data.rows.map(([label, value, text]) => (
                <article key={label} className="grid gap-3 rounded border border-[#193d39]/15 bg-[#fffaf0] p-5 md:grid-cols-[160px_1fr]">
                  <div>
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8a5b35]">{label}</span>
                    <strong className="mt-2 block text-2xl font-black text-[#145c4f]">{value}</strong>
                  </div>
                  <p className="m-0 leading-7 text-[#111c1d]/70">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="setup" className="bg-[#102d32] text-[#fff8ed]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[360px_1fr]">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#d8b66d]">{t.setup.eyebrow}</p>
              <h2 className="text-4xl font-black leading-tight md:text-5xl">{t.setup.title}</h2>
              <p className="mt-5 leading-8 text-white/68">{t.setup.body}</p>
            </div>
            <div className="grid gap-4">
              <CodeBlock label={t.setup.commandLabel} code={command} />
              <CodeBlock label={t.setup.configLabel} code={config} />
            </div>
          </div>
        </section>

        <section id="policy" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[360px_1fr]">
          <div>
            <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-[#8a5b35]">{t.policy.eyebrow}</p>
            <h2 className="text-4xl font-black leading-tight text-[#102d32] md:text-5xl">{t.policy.title}</h2>
            <p className="mt-5 leading-8 text-[#111c1d]/68">{t.policy.body}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {t.policy.items.map(([title, text]) => (
              <article key={title} className="rounded border border-[#193d39]/15 bg-[#fffaf0] p-5">
                <strong className="text-lg font-black text-[#145c4f]">{title}</strong>
                <p className="mt-3 text-sm leading-6 text-[#111c1d]/70">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#193d39]/15 bg-[#f8f2e8] px-5 py-7">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-[#111c1d]/62 md:flex-row">
          <span>Hadith MCP</span>
          <span>{t.footer}</span>
        </div>
      </footer>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded border border-white/15 bg-[#07161c]">
      <div className="border-b border-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#d8b66d]">{label}</div>
      <pre className="m-0 overflow-auto p-4 text-sm leading-7 text-[#e8f3ed]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
