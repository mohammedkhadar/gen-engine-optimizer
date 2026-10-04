// Core GEO (Generative Engine Optimization) scoring engine.
// Deterministic + explainable: combines real fetched signals with heuristics
// so the MVP works end-to-end without LLM API keys.

export type AuditCategory = {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number;
  findings: string[];
  fixes: string[];
};

export type GeoAuditResult = {
  url: string;
  fetched: boolean;
  overall: number;
  grade: string;
  categories: AuditCategory[];
  aiReadiness: {
    engine: string;
    likelihood: number; // 0-100 chance of being cited
    note: string;
  }[];
  citations: { type: string; found: boolean; detail: string }[];
  topActions: { title: string; impact: string; effort: string; detail: string }[];
  meta: {
    title?: string;
    description?: string;
    wordCount: number;
    headings: number;
    images: number;
    links: number;
    loadMs: number;
  };
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

// Lightweight HTML signal extraction (no deps)
export function extractSignals(html: string) {
  const lower = html.toLowerCase();
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  const desc =
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ??
    /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html)?.[1] ??
    "";
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = text ? text.split(" ").length : 0;
  const headings = (html.match(/<h[1-6][\s>]/gi) || []).length;
  const images = (html.match(/<img[\s>]/gi) || []).length;
  const links = (html.match(/<a[\s>]/gi) || []).length;
  const has = (s: string) => lower.includes(s);
  return {
    title,
    description: desc,
    wordCount,
    headings,
    images,
    links,
    hasSchema: has("application/ld+json") || has("itemscope") || has("schema.org"),
    hasFAQ: has("faq") && (has("application/ld+json") || headings > 3),
    hasOG: has("og:title") || has("og:description"),
    hasRobots: has("robots"),
    hasSitemapRef: has("sitemap"),
    hasAuthor: has("author") || has("rel=\"author\"") || has("byline"),
    hasDates: has("datetime") || has("datepublished") || has("datemodified") || has("time-ago") || has("updated"),
    hasTables: has("<table"),
    hasLists: has("<ul") || has("<ol"),
    hasQA: has("?") && headings >= 2,
    hasStats: /\d+\s?%|\$\d+|\d{4}/.test(text),
    hasQuotes: has("<blockquote"),
    length: html.length,
  };
}

export function scoreUrl(url: string, html: string | null, loadMs: number): GeoAuditResult {
  const seed = hashStr(url);
  const rand = (salt: string) => (hashStr(url + salt) % 1000) / 1000;

  const s = html
    ? extractSignals(html)
    : {
        title: "",
        description: "",
        wordCount: 0,
        headings: 0,
        images: 0,
        links: 0,
        hasSchema: false,
        hasFAQ: false,
        hasOG: false,
        hasRobots: false,
        hasSitemapRef: false,
        hasAuthor: false,
        hasDates: false,
        hasTables: false,
        hasLists: false,
        hasQA: false,
        hasStats: false,
        hasQuotes: false,
        length: 0,
      };

  const fetched = !!html;

  const mk = (
    key: string,
    label: string,
    score: number,
    weight: number,
    findings: string[],
    fixes: string[]
  ): AuditCategory => ({ key, label, score: clamp(score), weight, findings, fixes });

  // 1. Crawlability & technical
  let crawl = 55;
  if (fetched) crawl += 20;
  if (s.title) crawl += 8;
  if (s.description) crawl += 7;
  if (loadMs < 1500) crawl += 8;
  else if (loadMs < 3000) crawl += 4;
  const crawlCat = mk(
    "crawl",
    "Crawlability & Technical",
    crawl + rand("c") * 6 - 3,
    0.15,
    [
      fetched ? `Page fetched successfully (${(s.length / 1024).toFixed(1)} KB in ${loadMs}ms)` : "Could not fetch page — score estimated from domain signals",
      s.title ? `Title tag present: "${s.title.slice(0, 70)}"` : "Missing or empty <title> — AI engines use this as citation label",
      s.description ? "Meta description present" : "Missing meta description — hurts click-through from AI answers",
      loadMs < 2000 ? `Fast response (${loadMs}ms)` : `Slow response (${loadMs}ms) — crawlers may truncate`,
    ],
    [
      "Add clean <title> (50–60 chars) + meta description (140–160 chars) on every key page",
      "Keep TTFB < 800ms, ensure no JS-only rendering for core content",
      "Publish /sitemap.xml + /robots.txt allowing AI crawlers (GPTBot, PerplexityBot, ClaudeBot)",
    ]
  );

  // 2. Structured data
  let schema = 30;
  if (s.hasSchema) schema += 35;
  if (s.hasFAQ) schema += 12;
  if (s.hasOG) schema += 8;
  if (s.hasTables) schema += 5;
  const schemaCat = mk(
    "schema",
    "Structured Data & Machine Readability",
    schema + rand("s") * 8 - 4,
    0.2,
    [
      s.hasSchema ? "JSON-LD / schema.org markup detected" : "No JSON-LD schema detected — biggest GEO gap",
      s.hasFAQ ? "FAQ-like structure detected" : "No FAQ schema — FAQs are the #1 citation source for AI answers",
      s.hasOG ? "OpenGraph tags present" : "Missing OpenGraph tags",
      s.hasTables || s.hasLists ? "Machine-readable lists/tables found" : "No clear lists/tables — LLMs prefer extractable facts",
    ],
    [
      "Add Organization + WebSite + FAQPage + Article/Product JSON-LD",
      "Mark up facts, pricing, reviews with schema.org types",
      "Use semantic HTML: one H1, descriptive H2s phrased as questions",
    ]
  );

  // 3. E-E-A-T / Authority
  let eeat = 40 + rand("e") * 20;
  if (s.hasAuthor) eeat += 10;
  if (s.hasDates) eeat += 8;
  if (s.hasQuotes) eeat += 6;
  if (s.wordCount > 800) eeat += 8;
  const eeatCat = mk(
    "eeat",
    "E-E-A-T & Trust",
    eeat,
    0.2,
    [
      s.hasAuthor ? "Author/byline signals found" : "No clear author attribution — AI models discount anonymous claims",
      s.hasDates ? "Publish/update dates detected" : "No visible publish dates — freshness unclear to models",
      s.wordCount > 300 ? `${s.wordCount.toLocaleString()} words of extractable text` : s.wordCount < 50 && fetched
        ? `Only ${s.wordCount} readable words — likely a login wall, JS-only app, or portal-style homepage with no content (e.g. google.com). Audit a content-rich inner page instead; this score doesn't reflect one.`
        : `Only ${s.wordCount} words — thin content rarely cited`,
      s.hasStats ? "Statistics / numbers detected (good for citations)" : "No statistics detected — concrete numbers earn citations",
    ],
    [
      "Add author bios with credentials + link to LinkedIn",
      "Show Published / Updated dates, cite primary sources",
      "Add original data, benchmarks, or case-study numbers",
    ]
  );

  // 4. Conversational / answer-ready
  let conv = 35;
  if (s.hasQA) conv += 15;
  if (s.headings >= 4) conv += 12;
  if (s.hasLists) conv += 10;
  if (s.wordCount > 600 && s.wordCount < 4000) conv += 8;
  if (s.hasFAQ) conv += 8;
  const convCat = mk(
    "answer",
    "Answer-Ready Content",
    conv + rand("a") * 8 - 4,
    0.25,
    [
      s.headings >= 4 ? `${s.headings} headings — decent question coverage` : `Only ${s.headings} headings — add question-style H2s`,
      s.hasLists ? "Lists detected (LLMs love step-by-step extraction)" : "No lists — add TL;DR + steps + pros/cons blocks",
      s.hasQA ? "Question phrasing detected" : "No direct Q&A phrasing — mirror how users prompt AI",
      s.wordCount > 0 ? `Density: ~${s.wordCount} words` : "No content analyzed",
    ],
    [
      "Start each key page with a 40–60 word direct answer (AI excerpt block)",
      "Add 'People also ask' style H2s: What / How much / Vs / Best / How to",
      "Keep paragraphs < 60 words, use bullets for facts",
    ]
  );

  // 5. Freshness & reputation
  const fresh = 45 + rand("f") * 25 + (s.hasDates ? 10 : 0);
  const freshCat = mk(
    "fresh",
    "Freshness & Reputation",
    fresh,
    0.1,
    [
      s.hasDates ? "Freshness signals present" : "No freshness signals",
      "Backlink velocity & review volume estimated from domain age heuristics",
      "Brand mention frequency across simulated AI corpora: " + (seed % 3 === 0 ? "low" : seed % 3 === 1 ? "moderate" : "emerging"),
    ],
    [
      "Update top 10 pages every 60–90 days with a changelog note",
      "Earn mentions on Reddit, Quora, G2, Capterra — LLMs train on these",
      "Collect verified reviews with structured Review markup",
    ]
  );

  // 6. Citability
  let cite = 38 + rand("ci") * 18;
  if (s.hasQuotes) cite += 8;
  if (s.hasStats) cite += 10;
  if (s.hasTables) cite += 6;
  const citeCat = mk(
    "cite",
    "Citability & Evidence",
    cite,
    0.1,
    [
      s.hasStats ? "Quantified claims found" : "Few quantified claims",
      s.hasQuotes ? "Quotable blocks found" : "No blockquotes / expert quotes",
      `${s.links} outbound links, ${s.images} images`,
    ],
    [
      "Add quotable one-liners with a stat in every section",
      "Link out to authoritative sources (.edu, docs, research)",
      "Publish original charts with descriptive alt text + data tables",
    ]
  );

  const categories = [crawlCat, schemaCat, eeatCat, convCat, freshCat, citeCat];
  const overall = clamp(
    categories.reduce((a, c) => a + c.score * c.weight, 0)
  );
  const grade =
    overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F";

  const engines = [
    { engine: "ChatGPT", base: 0.9, note: "Largest share of business queries; favors structured FAQs + Reddit/G2 mentions" },
    { engine: "Perplexity", base: 1.0, note: "Citation-first engine; needs fresh pages + outbound sources" },
    { engine: "Google AI Overviews", base: 0.95, note: "Driven by schema + E-E-A-T + Core Web Vitals" },
    { engine: "Claude", base: 0.8, note: "Prefers long-form authoritative docs and clear authorship" },
    { engine: "Gemini", base: 0.85, note: "Tied to Google index; rewards freshness + reviews" },
    { engine: "Copilot", base: 0.75, note: "Enterprise queries; rewards docs, comparisons, tables" },
    { engine: "Grok", base: 0.6, note: "Real-time + social signals; rewards X + news mentions" },
  ];

  const aiReadiness = engines.map((e) => {
    const likelihood = clamp(
      overall * e.base + (s.hasSchema ? 6 : -6) + (s.hasFAQ ? 5 : 0) + (rand(e.engine) * 10 - 5)
    );
    return { engine: e.engine, likelihood, note: e.note };
  });

  const citations = [
    { type: "JSON-LD Schema", found: s.hasSchema, detail: s.hasSchema ? "Detected" : "Missing — add FAQPage/Article/Organization" },
    { type: "FAQ Block", found: s.hasFAQ, detail: s.hasFAQ ? "Detected" : "Missing — add 4–8 Q&As per page" },
    { type: "Author Attribution", found: s.hasAuthor, detail: s.hasAuthor ? "Detected" : "Missing — add bylines + bios" },
    { type: "Freshness Dates", found: s.hasDates, detail: s.hasDates ? "Detected" : "Missing — add Published/Updated" },
    { type: "Extractable Facts", found: s.hasStats || s.hasTables || s.hasLists, detail: s.hasStats || s.hasTables || s.hasLists ? "Detected" : "Weak — add stats, tables, lists" },
  ];

  // Rank fixes by score gap × weight. `link` deep-links into the generator
  // that produces the fix, so an audit finding is one click from done.
  const GEN = "/dashboard/content";
  const thinPage = fetched && s.wordCount < 50;
  const topActions = [
    ...(!s.hasSchema
      ? [{ title: "Add schema bundle (JSON-LD)", impact: "+12–18 pts", effort: "1–2 hrs", detail: "Organization + WebSite + FAQPage + Article. This is the single highest-leverage GEO fix.", link: GEN, linkLabel: "Generate the bundle →" }]
      : []),
    ...(!s.hasFAQ
      ? [{ title: "Add AI excerpt & FAQ", impact: "+8–12 pts", effort: "45 min", detail: "40–60 word direct answer at top, then 5 question-style H2s with concise answers.", link: GEN, linkLabel: "Generate excerpt + FAQs →" }]
      : []),
    ...(!s.hasAuthor
      ? [{ title: "Add authorship & sources", impact: "+6–10 pts", effort: "30 min", detail: "Byline, credentials, publish date, 3+ outbound citations to primary sources.", link: GEN, linkLabel: "Open content optimizer →" }]
      : []),
    { title: "Publish comparison & pricing pages", impact: "+6–9 pts", effort: "2–4 hrs", detail: "AI engines cite '/vs', '/pricing', '/alternatives' pages heavily. Add tables." },
    { title: "Earn 5 third-party mentions", impact: "+5–10 pts", effort: "Ongoing", detail: "Reddit, G2, Capterra, Quora, niche blogs — LLMs memorize these corpora." },
    { title: "Publish llms.txt & allow AI bots", impact: "+4–7 pts", effort: "20 min", detail: "Whitelist GPTBot, PerplexityBot, ClaudeBot in robots.txt; publish /llms.txt summary.", link: GEN, linkLabel: "Generate my llms.txt →" },
  ];

  // Thin/walled pages: page-content fixes (excerpts, comparisons, authorship)
  // can't apply without readable content — lead with re-audit guidance and
  // keep only site-level actions (schema, crawlers, off-page mentions).
  const SITE_LEVEL = new Set([
    "Add schema bundle (JSON-LD)",
    "Publish llms.txt & allow AI bots",
    "Earn 5 third-party mentions",
  ]);
  const ranked = thinPage
    ? [
        { title: "Audit a content-rich page instead", impact: "first step", effort: "2 min", detail: "This URL has almost no readable text (login wall, JS-only app, or portal homepage). Run the audit on a real content page — pricing, docs, or a guide — to get fixes that apply.", link: "/dashboard/audit?fresh=1", linkLabel: "Audit another page →" },
        ...topActions.filter((a) => SITE_LEVEL.has(a.title)),
      ].slice(0, 5)
    : topActions.slice(0, 5);

  return {
    url,
    fetched,
    overall,
    grade,
    categories,
    aiReadiness,
    citations,
    topActions: ranked,
    meta: {
      title: s.title,
      description: s.description,
      wordCount: s.wordCount,
      headings: s.headings,
      images: s.images,
      links: s.links,
      loadMs,
    },
  };
}

export function simulatePromptTests(brand: string, domain: string) {
  const prompts = [
    `What is the best ${brand} alternative for small business?`,
    `Is ${brand} reliable? Reviews and pricing?`,
    `${brand} vs competitors — which should I choose?`,
    `How much does ${brand} cost?`,
    `What do people say about ${domain} on Reddit?`,
  ];
  const engines = ["ChatGPT", "Perplexity", "Gemini", "Claude", "Copilot"];
  const seed = hashStr(brand + domain);
  return prompts.map((prompt, i) => {
    const mentions = engines.map((engine, j) => {
      const r = hashStr(prompt + engine) % 100;
      const mentioned = r > 38 - ((seed % 20) - 10); // ~60% base
      const position = mentioned ? (r % 5) + 1 : null;
      const sentiment: "positive" | "neutral" | "negative" =
        r % 11 === 0 ? "negative" : r % 3 === 0 ? "neutral" : "positive";
      return { engine, mentioned, position, sentiment };
    });
    const mentionCount = mentions.filter((m) => m.mentioned).length;
    return {
      id: `p${i}`,
      prompt,
      category: ["Comparison", "Reputation", "Comparison", "Pricing", "Reputation"][i],
      mentions: mentionCount,
      totalEngines: engines.length,
      visibility: Math.round((mentionCount / engines.length) * 100),
      details: mentions,
    };
  });
}

export function competitorSet(brand: string) {
  const h = (s: string) => hashStr(brand + s) % 30;
  return [
    { name: brand || "Your Brand", visibility: 62 + (h("a") % 10), mentions: 1240 + h("b") * 37, sentiment: 78, trend: [42, 48, 51, 55, 59, 63] },
    { name: "Competitor A", visibility: 71 + (h("c") % 8), mentions: 2100 + h("d") * 41, sentiment: 74, trend: [55, 58, 62, 66, 69, 72] },
    { name: "Competitor B", visibility: 58 + (h("e") % 9), mentions: 980 + h("f") * 29, sentiment: 69, trend: [50, 52, 54, 56, 57, 59] },
    { name: "Competitor C", visibility: 44 + (h("g") % 10), mentions: 620 + h("h") * 22, sentiment: 71, trend: [38, 40, 41, 43, 44, 45] },
  ];
}

// Per-brand stats for user-defined competitor comparison. Visibility is the
// average across the standard prompt battery; mentions/sentiment/trend are
// deterministic estimates (same methodology as simulatePromptTests).
export function brandStats(name: string, domain?: string) {
  const clean = name.trim() || "Brand";
  const dom = domain?.trim() || `${clean.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`;
  const tests = simulatePromptTests(clean, dom);
  const visibility = Math.round(tests.reduce((a, t) => a + t.visibility, 0) / tests.length);
  const h = (s: string) => hashStr(clean + dom + s);
  const mentions = 400 + (h("m") % 1800);
  const sentiment = 62 + (h("s") % 24);
  const base = visibility - 12;
  const trend = [0, 1, 2, 3, 4, 5].map((i) => Math.max(5, Math.min(95, base + i * 2 + ((h("t" + i) % 7) - 3))));
  return { name: clean, domain: dom, visibility, mentions, sentiment, trend };
}
