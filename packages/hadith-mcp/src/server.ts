import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerHadithTools } from "./tools/register.js";
import { createFixtureHadithService, type HadithService } from "./tools/service.js";
import { createSqliteHadithService } from "./tools/sqlite-service.js";

export type HadithMcpServerOptions = {
  service?: HadithService;
  dbPath?: string;
};

export function createHadithServiceFromEnv(env: NodeJS.ProcessEnv = process.env): HadithService {
  const dbPath = env.HADITH_MCP_DB_PATH;
  return dbPath === undefined || dbPath.trim().length === 0
    ? createFixtureHadithService()
    : createSqliteHadithService(dbPath);
}

export function createHadithMcpServer(options: HadithMcpServerOptions = {}): McpServer {
  const service = options.service ?? (options.dbPath === undefined ? createFixtureHadithService() : createSqliteHadithService(options.dbPath));
  const server = new McpServer(
    {
      name: "hadith-mcp",
      version: "0.0.0"
    },
    {
      instructions:
        "Read-only Hadith MCP. Return cited source text and metadata only; do not issue fatwas or generated religious interpretation."
    }
  );

  registerHadithTools(server, service);
  return server;
}
