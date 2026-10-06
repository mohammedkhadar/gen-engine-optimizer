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
    // Reasoning models (gpt-oss) put output in `reasoning` with empty content.
    const msg = data.choices?.[0]?.message;
    const text: string | null = msg?.content || msg?.reasoning || null;
    return text && text.trim() ? text : null;
  } catch {
    return null;
  }
}

/** Groq — hosted open-source models (Qwen, GPT-OSS, Llama). Generous free tier.
 *  Default is a plain chat model: reasoning models answer in a separate field
 *  that doesn't suit prompt generation or citation snippets. */
async function queryGroq(prompt: string): Promise<{ text: string; model: string } | null> {
  if (!process.env.GROQ_API_KEY) return null;
  const model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
  const text = await queryOpenAICompatible("https://api.groq.com/openai/v1", process.env.GROQ_API_KEY, model, prompt);
  return text ? { text, model } : null;
}

function openModelLabel(model: string) {
  const m = model.toLowerCase();
  if (m.includes("llama")) return "Llama (open)";
  if (m.includes("qwen")) return "Qwen (open)";
  if (m.includes("mistral") || m.includes("mixtral")) return "Mistral (open)";
  if (m.includes("gpt-oss")) return "GPT-OSS (open)";
  if (m.includes("deepseek")) return "DeepSeek (open)";
  return "Open model";
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
  const allEngines = openModel
    ? [...engines, `${openModelLabel(openModel.model)} via ${groq ? "Groq" : "Ollama"}`]
    : engines;

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
    const isOpenRow = j === engines.length;
    if (engine === "Perplexity" && pplx) { text = pplx.text; sources = pplx.sources; }
    else if (engine === "ChatGPT" && oai) { text = oai; }
    else if (isOpenRow && openModel) {
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
      provider: text ? rowProvider : "heuristic",
    };
  });
}

/** Generate 5 buyer prompts from real page content using an LLM (Groq first,
 *  then OpenAI). Returns null when no key is set or parsing fails — callers
 *  fall back to the template battery. */
export async function generateBusinessPrompts(
  brand: string,
  domain: string,
  pageText: string
): Promise<string[] | null> {
  const text = pageText.slice(0, 3000);
  if (!text.trim()) return null;
  const system = `You write buyer research prompts for AI-visibility testing. Given a business web page, write exactly 5 diverse questions a real buyer would ask an AI assistant: one comparing alternatives, one about reputation/reviews, one direct vs-competitor, one about pricing, one about community opinion (Reddit/forums). Reply with ONLY a JSON array of 5 strings, no other text.`;
  const user = `Business: ${brand} (${domain}). Page content:\n${text}\n\nWrite the 5 buyer questions.`;
  const attempts: { base: string; key?: string; model: string }[] = [
    { base: "https://api.groq.com/openai/v1", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b" },
    { base: "https://api.openai.com/v1", key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || "gpt-4o-mini" },
  ];
  for (const a of attempts) {
    if (!a.key) continue;
    try {
      const res = await fetch(`${a.base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${a.key}` },
        body: JSON.stringify({
          model: a.model,
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          max_tokens: 400,
          temperature: 0.7,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      let raw: string = msg?.content || msg?.reasoning || "";
      raw = raw.replace(/```json|```/g, "").trim();
      // Reasoning models may wrap the answer in thinking — extract the last
      // JSON array-looking block if the whole text isn't one.
      if (!raw.startsWith("[")) {
        const m = raw.match(/\[[\s\S]*\]/);
        if (m) raw = m[0];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 5 && parsed.every((p) => typeof p === "string" && p.length > 10)) {
        return parsed;
      }
    } catch {
      continue;
    }
  }
  return null;
}

/** Suggest rival businesses (name + domain) from page content via LLM.
 *  Returns [] when no key is set — the dialog then starts empty for manual entry. */
export async function suggestCompetitors(
  brand: string,
  domain: string,
  pageText: string
): Promise<{ name: string; domain: string }[]> {
  const text = pageText.slice(0, 2500);
  if (!text.trim()) return [];
  const system = `You identify competitors for AI-visibility benchmarking. Given a business web page, name 3 direct competing businesses (not the business itself). Reply with ONLY a JSON array of objects like [{"name":"...","domain":"..."}], no other text. Domains must be plausible root domains.`;
  const attempts: { base: string; key?: string; model: string }[] = [
    { base: "https://api.groq.com/openai/v1", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b" },
    { base: "https://api.openai.com/v1", key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL || "gpt-4o-mini" },
  ];
  for (const a of attempts) {
    if (!a.key) continue;
    try {
      const res = await fetch(`${a.base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${a.key}` },
        body: JSON.stringify({
          model: a.model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: `Business: ${brand} (${domain}). Page content:\n${text}` },
          ],
          max_tokens: 300,
          temperature: 0.5,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const msg = data.choices?.[0]?.message;
      let raw: string = msg?.content || "";
      raw = raw.replace(/```json|```/g, "").trim();
      if (!raw.startsWith("[")) {
        const m = raw.match(/\[[\s\S]*\]/);
        if (m) raw = m[0];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      const clean = parsed
        .filter((c: any) => c && typeof c.name === "string" && c.name.trim())
        .map((c: any) => ({
          name: String(c.name).trim().slice(0, 60),
          domain: String(c.domain ?? "")
            .trim()
            .toLowerCase()
            .replace(/^https?:\/\//, "")
            .replace(/\/.*$/, "")
            .slice(0, 80),
        }))
        .filter((c: { name: string }) => c.name.toLowerCase() !== brand.toLowerCase())
        .slice(0, 5);
      if (clean.length >= 2) return clean;
    } catch {
      continue;
    }
  }
  return [];
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
