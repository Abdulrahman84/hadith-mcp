#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createHadithMcpServer, createHadithServiceFromEnv } from "./server.js";

async function main(): Promise<void> {
  const dbPath = process.env.HADITH_MCP_DB_PATH;
  const server = createHadithMcpServer({ service: createHadithServiceFromEnv() });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    dbPath === undefined || dbPath.trim().length === 0
      ? "hadith-mcp running on stdio with fixture-only data; set HADITH_MCP_DB_PATH for SQLite data"
      : `hadith-mcp running on stdio with SQLite data: ${dbPath}`
  );
}

main().catch((error: unknown) => {
  console.error("hadith-mcp failed to start", error);
  process.exit(1);
});
