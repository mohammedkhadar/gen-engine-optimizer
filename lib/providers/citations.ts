// Real citation providers with graceful fallback.
// Priority: Exa (neural search, best for "who cites whom") →
// Perplexity (Sonar, citation-first answers) → OpenAI (general) →
// Groq (hosted open-source Llama, free tier) → Ollama (fully local
// open-source models: llama3.1, mistral, qwen2.5 — zero cost) →
// deterministic heuristic (demo / no keys).
// Set EXA_API_KEY, PERPLEXITY_API_KEY, OPENAI_API_KEY, GROQ_API_KEY,
// or run Ollama locally to go live.

import { simulatePromptTests } from "@/lib/geo-engine";

export type EngineResult = {
  engine: string;
  mentioned: boolean;
  position: number | null;
  sentiment: "positive" | "neutral" | "negative";
  snippet?: string;
  sources?: string[];
  provider: string;
};

async function queryPerplexity(prompt: string, brand: string): Promise<{ text: string; sources: string[] } | null> {
  if (!process.env.PERPLEXITY_API_KEY) return null;
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [{ role: "user", content: prompt }],
        return_citations: true,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const sources: string[] = data.citations ?? [];
    return { text, sources };
  } catch {
    return null;
  }
}

async function queryExa(brand: string, domain: string): Promise<string[] | null> {
  if (!process.env.EXA_API_KEY) return null;
  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.EXA_API_KEY },
      body: JSON.stringify({ query: `${brand} ${domain} reviews pricing`, numResults: 8, type: "neural" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results ?? []).map((r: any) => r.url).filter(Boolean);
  } catch {
    return null;
  }
}

async function queryOpenAICompatible(
  baseURL: string,
  apiKey: string | undefined,
  model: string,
  prompt: string
): Promise<string | null> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const res = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 500 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

/** Groq — hosted open-source models (Llama 3.3, Mixtral, Qwen). Generous free tier. */
async function queryGroq(prompt: string): Promise<{ text: string; model: string } | null> {
  if (!process.env.GROQ_API_KEY) return null;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const text = await queryOpenAICompatible("https://api.groq.com/openai/v1", process.env.GROQ_API_KEY, model, prompt);
  return text ? { text, model } : null;
}

async function queryOpenAI(prompt: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  return queryOpenAICompatible(
    "https://api.openai.com/v1",
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_MODEL || "gpt-4o-mini",
    prompt
  );
}
/** Ollama — fully local open-source models (llama3.1, mistral, qwen2.5). Free forever. */
async function queryOllama(prompt: string): Promise<{ text: string; model: string } | null> {
  const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
  const model = process.env.OLLAMA_MODEL || "llama3.1";
  // Only attempt when explicitly enabled or the daemon is reachable — fast fail otherwise.
  if (!process.env.OLLAMA_MODEL && !process.env.OLLAMA_ENABLED) {
    try {
      const ping = await fetch((process.env.OLLAMA_BASE_URL || "http://localhost:11434") + "/api/tags", {
        signal: AbortSignal.timeout(1500),
      });
      if (!ping.ok) return null;
    } catch {
      return null;
    }
  }
  const text = await queryOpenAICompatible(baseURL, undefined, model, prompt);
  return text ? { text, model } : null;
}

function mentionsBrand(text: string, brand: string, domain: string) {
  const t = text.toLowerCase();
  return t.includes(brand.toLowerCase()) || t.includes(domain.toLowerCase());
}

/** Live prompt test: tries real providers, falls back to heuristic per-engine. */
export async function livePromptTest(brand: string, domain: string, prompt: string): Promise<EngineResult[]> {
  const engines = ["ChatGPT", "Perplexity", "Gemini", "Claude", "Copilot"];
  const sim = simulatePromptTests(brand, domain).find((t) => t.prompt === prompt);

  // Try real signals in parallel (each optional).
  const [pplx, exaSources, oai, groq, ollama] = await Promise.all([
    queryPerplexity(prompt, brand),
    queryExa(brand, domain),
    queryOpenAI(prompt),
    queryGroq(prompt),
    queryOllama(prompt),
  ]);

  // An open-source engine row appears only when Groq or Ollama is actually reachable.
  const openModel = groq ?? ollama;
  const allEngines = openModel ? [...engines, `Llama 3 (open, via ${groq ? "Groq" : "Ollama"})`] : engines;

  const anyReal = pplx || exaSources || oai || openModel;
  const provider = pplx
    ? "perplexity"
    : oai
      ? "openai"
      : groq
        ? "groq"
        : ollama
          ? "ollama"
          : exaSources
            ? "exa"
            : "heuristic";

  return allEngines.map((engine, j) => {
    const d = sim?.details[j]; // undefined for the open-source row — uses real text only
    if (!anyReal || (!d && !openModel) || !sim) {
      return {
        engine,
        mentioned: d?.mentioned ?? false,
        position: d?.position ?? null,
        sentiment: (d?.sentiment as any) ?? "neutral",
        provider: "heuristic",
      } as EngineResult;
    }
    // Ground Perplexity + OpenAI + open-model text; other engines use heuristic blended with real sources.
    let text = "";
    let sources: string[] = [];
    let rowProvider = provider;
    if (engine === "Perplexity" && pplx) { text = pplx.text; sources = pplx.sources; }
    else if (engine === "ChatGPT" && oai) { text = oai; }
    else if (engine.startsWith("Llama 3") && openModel) {
      text = openModel.text;
      rowProvider = groq ? "groq" : "ollama";
    }
    else if (pplx) { text = pplx.text; sources = pplx.sources; }
    if (exaSources) sources = Array.from(new Set([...sources, ...exaSources])).slice(0, 8);

    const mentioned = text ? mentionsBrand(text, brand, domain) : (d?.mentioned ?? false);
    return {
      engine,
      mentioned,
      position: mentioned ? (d?.position ?? 3) : null,
      sentiment: mentioned ? "positive" as const : "neutral" as const,
      snippet: text ? text.slice(0, 280) : undefined,
      sources: sources.length ? sources : undefined,
      provider: rowProvider,
    };
  });
}

export function providerStatus() {
  const live =
    process.env.PERPLEXITY_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.EXA_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OLLAMA_MODEL ||
    process.env.OLLAMA_ENABLED;
  return {
    perplexity: !!process.env.PERPLEXITY_API_KEY,
    exa: !!process.env.EXA_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    ollama: !!(process.env.OLLAMA_MODEL || process.env.OLLAMA_ENABLED),
    mode: live ? "live" : "heuristic",
  };
}
