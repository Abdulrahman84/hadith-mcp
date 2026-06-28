import type { Metadata } from "next";
import { DocsPage } from "../../components/DocsPage";

export const metadata: Metadata = {
  title: "Hadith MCP — التوثيق العربي",
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      ar: "/"
    }
  }
};

export default function ArabicPage() {
  return <DocsPage locale="ar" />;
}
