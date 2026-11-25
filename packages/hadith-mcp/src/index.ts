export {
  createHadithMcpServer,
  createHadithServiceFromEnv,
  createHybridSearcherFromEnv,
  type HadithMcpServerOptions
} from "./server.js";
export {
  createEmbeddingProviderFromEnv,
  createFakeEmbeddingProvider,
  createOllamaEmbeddingProvider,
  createOpenAiCompatibleEmbeddingProvider,
  type EmbeddingProvider
} from "./embeddings/provider.js";
export { buildEmbeddingIndex, loadEmbeddingIndex, type LoadedEmbeddingIndex } from "./embeddings/store.js";
export { reciprocalRankFusion } from "./search/rrf.js";
export {
  checkQueryEmbedding,
  createHybridSearcher,
  type HybridSearcher,
  type HybridSearchOutput,
  type HybridSearchResult,
  type QueryEmbeddingSource
} from "./search/hybrid-search.js";
export {
  createFixtureHadithService,
  fetchHadith,
  getHadithGrade,
  getHadithMetadata,
  listCollections,
  searchHadith,
  validateHadithReference,
  type HadithService
} from "./tools/service.js";
export { createSqliteHadithService } from "./tools/sqlite-service.js";
export type { CollectionSummary, Grade, HadithRecord, Language, SearchResult, ToolError } from "./types.js";
