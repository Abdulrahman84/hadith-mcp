import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createEmbeddingProviderFromEnv } from "./embeddings/provider.js";
import { createHybridSearcher, type HybridSearcher } from "./search/hybrid-search.js";
import { registerHadithTools } from "./tools/register.js";
import { createFixtureHadithService, type HadithService } from "./tools/service.js";
import { createSqliteHadithService } from "./tools/sqlite-service.js";

export type HadithMcpServerOptions = {
  service?: HadithService;
  dbPath?: string;
  hybridSearch?: HybridSearcher;
};

export function createHadithServiceFromEnv(env: NodeJS.ProcessEnv = process.env): HadithService {
  const dbPath = env.HADITH_MCP_DB_PATH;
  return dbPath === undefined || dbPath.trim().length === 0
    ? createFixtureHadithService()
    : createSqliteHadithService(dbPath);
}

/**
 * HADITH_MCP_EMBEDDINGS_PATH points at the file built by `npm run build:embeddings`.
 * Without it, semantic_search_hadith answers with full-text results and says so.
 */
export function createHybridSearcherFromEnv(service: HadithService, env: NodeJS.ProcessEnv = process.env): HybridSearcher {
  const indexPath = env.HADITH_MCP_EMBEDDINGS_PATH?.trim() || null;

  const weight = Number.parseFloat(env.HADITH_MCP_VECTOR_WEIGHT ?? "");

  return createHybridSearcher({
    service,
    indexPath,
    provider: indexPath === null ? null : createEmbeddingProviderFromEnv(env),
    defaultVectorWeight: Number.isFinite(weight) ? weight : undefined
  });
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

  registerHadithTools(server, service, options.hybridSearch);
  return server;
}
