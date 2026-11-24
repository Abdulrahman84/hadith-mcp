export type EmbeddingProvider = {
  readonly name: string;
  readonly model: string;
  embed(texts: string[]): Promise<Float32Array[]>;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

type HttpProviderOptions = {
  model?: string | undefined;
  timeoutMs?: number | undefined;
  fetchImpl?: FetchLike | undefined;
};

const defaultTimeoutMs = 60_000;

export function normalizeVector(values: ArrayLike<number>): Float32Array {
  const vector = Float32Array.from(values);
  let norm = 0;

  for (const value of vector) {
    norm += value * value;
  }

  norm = Math.sqrt(norm);

  if (norm === 0) {
    return vector;
  }

  for (let index = 0; index < vector.length; index += 1) {
    vector[index] = vector[index]! / norm;
  }

  return vector;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

// Hosted embedding APIs occasionally answer "overloaded" (HTTP 429) or a 5xx; a quick retry
// almost always succeeds, so a search does not drop to full-text over a momentary hiccup.
const retryDelaysMs = [250, 750];
const maxRetryAfterMs = 2_000;

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function retryDelay(response: Response, attempt: number): number {
  const retryAfter = Number.parseFloat(response.headers.get("retry-after") ?? "");
  const fallback = retryDelaysMs[attempt] ?? retryDelaysMs[retryDelaysMs.length - 1]!;
  return Number.isFinite(retryAfter) && retryAfter >= 0 ? Math.min(retryAfter * 1000, maxRetryAfterMs) : fallback;
}

async function postJson(fetchImpl: FetchLike, url: string, body: unknown, headers: Record<string, string>, timeoutMs: number) {
  let response: Response;

  for (let attempt = 0; ; attempt += 1) {
    response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (response.ok || !isRetryableStatus(response.status) || attempt >= retryDelaysMs.length) {
      break;
    }

    await response.body?.cancel().catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, retryDelay(response, attempt)));
  }

  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    throw new Error(`Embedding request to ${url} failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return (await response.json()) as unknown;
}

function assertBatch(vectors: number[][], expected: number, providerName: string): Float32Array[] {
  if (vectors.length !== expected) {
    throw new Error(`${providerName} returned ${vectors.length} embeddings for ${expected} inputs.`);
  }

  return vectors.map((vector) => normalizeVector(vector));
}

export function createOllamaEmbeddingProvider(options: HttpProviderOptions & { baseUrl?: string | undefined } = {}): EmbeddingProvider {
  const baseUrl = (options.baseUrl ?? "http://127.0.0.1:11434").replace(/\/+$/, "");
  const model = options.model ?? "bge-m3";
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;

  return {
    name: "ollama",
    model,
    async embed(texts) {
      if (texts.length === 0) {
        return [];
      }

      const payload = await postJson(fetchImpl, `${baseUrl}/api/embed`, { model, input: texts }, {}, timeoutMs);
      const embeddings = (payload as { embeddings?: unknown }).embeddings;

      if (!Array.isArray(embeddings) || !embeddings.every(isNumberArray)) {
        throw new Error("Ollama returned an unexpected embedding payload.");
      }

      return assertBatch(embeddings, texts.length, "Ollama");
    }
  };
}

export function createOpenAiCompatibleEmbeddingProvider(
  options: HttpProviderOptions & { baseUrl: string; apiKey?: string | undefined }
): EmbeddingProvider {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const model = options.model ?? "bge-m3";
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  const headers: Record<string, string> = options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {};

  return {
    name: "openai-compatible",
    model,
    async embed(texts) {
      if (texts.length === 0) {
        return [];
      }

      const payload = await postJson(fetchImpl, `${baseUrl}/embeddings`, { model, input: texts }, headers, timeoutMs);
      const data = (payload as { data?: unknown }).data;

      if (!Array.isArray(data)) {
        throw new Error("Embedding endpoint returned an unexpected payload.");
      }

      // The spec allows out-of-order items, so sort by index before pairing with inputs.
      const ordered = [...data].sort(
        (left, right) => ((left as { index?: number }).index ?? 0) - ((right as { index?: number }).index ?? 0)
      );
      const vectors = ordered.map((item) => (item as { embedding?: unknown }).embedding);

      if (!vectors.every(isNumberArray)) {
        throw new Error("Embedding endpoint returned a non-numeric embedding.");
      }

      return assertBatch(vectors, texts.length, "Embedding endpoint");
    }
  };
}

function hashToken(token: string): number {
  let hash = 2166136261;

  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/**
 * Deterministic hashed bag-of-words embedder for tests. Texts that share tokens
 * get similar vectors, which is enough to exercise ranking without a model.
 */
export function createFakeEmbeddingProvider(options: { dims?: number; model?: string } = {}): EmbeddingProvider {
  const dims = options.dims ?? 64;
  const model = options.model ?? `fake-hash-${dims}`;

  return {
    name: "fake",
    model,
    async embed(texts) {
      return texts.map((text) => {
        const vector = new Float32Array(dims);
        const tokens = text
          .toLowerCase()
          .replace(/[ً-ٰٟ]/g, "")
          .split(/[^\p{L}\p{N}]+/u)
          .filter((token) => token.length > 0);

        for (const token of tokens) {
          const hash = hashToken(token);
          const slot = hash % dims;
          vector[slot] = vector[slot]! + ((hash >>> 16) % 2 === 0 ? 1 : -1);
        }

        return normalizeVector(vector);
      });
    }
  };
}

/**
 * EMBEDDINGS_PROVIDER: "ollama" (default), "openai" (any OpenAI-compatible /embeddings API), or "none".
 * When EMBEDDINGS_PROVIDER is unset and EMBEDDINGS_BASE_URL is set, the OpenAI-compatible provider is used.
 */
export function createEmbeddingProviderFromEnv(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl?: FetchLike
): EmbeddingProvider | null {
  const explicit = env.EMBEDDINGS_PROVIDER?.trim().toLowerCase();
  const baseUrl = env.EMBEDDINGS_BASE_URL?.trim();
  const kind = explicit || (baseUrl ? "openai" : "ollama");
  const model = env.EMBEDDINGS_MODEL?.trim() || undefined;
  const timeoutMs = Number.parseInt(env.EMBEDDINGS_TIMEOUT_MS ?? "", 10);
  const common = {
    model,
    fetchImpl,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : undefined
  };

  if (kind === "none") {
    return null;
  }

  if (kind === "openai") {
    if (!baseUrl) {
      return null;
    }

    return createOpenAiCompatibleEmbeddingProvider({ ...common, baseUrl, apiKey: env.EMBEDDINGS_API_KEY?.trim() });
  }

  return createOllamaEmbeddingProvider({ ...common, baseUrl: env.OLLAMA_URL?.trim() || undefined });
}
