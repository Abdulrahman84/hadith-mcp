#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createHadithMcpServer } from "./server.js";

async function main(): Promise<void> {
  const server = createHadithMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("hadith-mcp running on stdio with fixture-only data");
}

main().catch((error: unknown) => {
  console.error("hadith-mcp failed to start", error);
  process.exit(1);
});
