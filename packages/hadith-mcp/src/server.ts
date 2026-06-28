import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHadithTools } from "./tools/register.js";

export function createHadithMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "hadith-mcp",
      version: "0.0.0"
    },
    {
      instructions:
        "Read-only fixture-backed Hadith MCP. Do not use fixture data for religious claims; real source data requires the audited SQLite importer."
    }
  );

  registerHadithTools(server);
  return server;
}
