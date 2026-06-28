import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  fetchHadithInputShape,
  fetchHadithOutputShape,
  gradeOutputShape,
  listCollectionsInputShape,
  listCollectionsOutputShape,
  metadataOutputShape,
  referenceInputShape,
  searchHadithInputShape,
  searchHadithOutputShape,
  validateReferenceOutputShape
} from "../schemas.js";
import {
  fetchHadith,
  getHadithGrade,
  getHadithMetadata,
  listCollections,
  searchHadith,
  validateHadithReference
} from "./service.js";

function jsonText(value: unknown) {
  return [{ type: "text" as const, text: JSON.stringify(value, null, 2) }];
}

export function registerHadithTools(server: McpServer): void {
  server.registerTool(
    "list_collections",
    {
      title: "List Hadith Collections",
      description: "Return available fixture collections and metadata.",
      inputSchema: listCollectionsInputShape,
      outputSchema: listCollectionsOutputShape
    },
    async () => {
      const structuredContent = listCollections();
      return { content: jsonText(structuredContent), structuredContent };
    }
  );

  server.registerTool(
    "fetch_hadith",
    {
      title: "Fetch Hadith",
      description: "Fetch one fixture-backed hadith record by collection and hadith number.",
      inputSchema: fetchHadithInputShape,
      outputSchema: fetchHadithOutputShape
    },
    async (args) => {
      const structuredContent = fetchHadith(args);
      return { content: jsonText(structuredContent), structuredContent };
    }
  );

  server.registerTool(
    "search_hadith",
    {
      title: "Search Hadith",
      description: "Search fixture-backed Arabic and English hadith text. Returns snippets and citations only.",
      inputSchema: searchHadithInputShape,
      outputSchema: searchHadithOutputShape
    },
    async (args) => {
      const structuredContent = searchHadith(args);
      return { content: jsonText(structuredContent), structuredContent };
    }
  );

  server.registerTool(
    "validate_hadith_reference",
    {
      title: "Validate Hadith Reference",
      description: "Check whether a collection and hadith number exist in the fixture dataset.",
      inputSchema: referenceInputShape,
      outputSchema: validateReferenceOutputShape
    },
    async (args) => {
      const structuredContent = validateHadithReference(args);
      return { content: jsonText(structuredContent), structuredContent };
    }
  );

  server.registerTool(
    "get_hadith_metadata",
    {
      title: "Get Hadith Metadata",
      description: "Return non-text fixture metadata for a hadith record.",
      inputSchema: referenceInputShape,
      outputSchema: metadataOutputShape
    },
    async (args) => {
      const structuredContent = getHadithMetadata(args);
      return { content: jsonText(structuredContent), structuredContent };
    }
  );

  server.registerTool(
    "get_hadith_grade",
    {
      title: "Get Hadith Grade",
      description: "Return a source-attributed grade when available; otherwise return grade null with provenance notes.",
      inputSchema: referenceInputShape,
      outputSchema: gradeOutputShape
    },
    async (args) => {
      const structuredContent = getHadithGrade(args);
      return { content: jsonText(structuredContent), structuredContent };
    }
  );
}
