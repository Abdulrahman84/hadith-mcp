import type { Metadata } from "next";
import { DocsPage } from "../../components/DocsPage";

export const metadata: Metadata = {
  title: "Hadith MCP — English Documentation",
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      ar: "/"
    }
  }
};

export default function EnglishPage() {
  return <DocsPage locale="en" />;
}
