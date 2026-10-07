// Core GEO (Generative Engine Optimization) scoring engine.
// Deterministic + explainable: combines real fetched signals with heuristics
// so the MVP works end-to-end without LLM API keys.

import { extractContentLines } from "./fetch-page";

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

// Lightweight HTML signal extraction (no deps). Word count comes from the
// shared content pipeline (fetch-page), so the audit and the optimizer
// always agree on how much readable text a page has.
export function extractSignals(html: string) {
  const lower = html.toLowerCase();
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  const desc =
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ??
    /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html)?.[1] ??
    "";
  const text = extractContentLines(html).join("\n");
  const wordCount = text ? text.split(/\s+/).length : 0;
  const headings = (html.match(/<h[1-6][\s>]/gi) || []).length;
  const images = (html.match(/<img[\s>]/gi) || []).length;
  const links = (html.match(/<a[\s>]/gi) || []).length;
  // Discover pricing/comparison pages from outbound links — multilingual slugs
  // included (cennik/ceny, preise, tarifs, precios, porównanie, vergleich…).
  const hrefs: string[] = [];
  const hrefRe = /<a[^>]+href=["']([^"']+)["']/gi;
  let hm: RegExpExecArray | null;
  while ((hm = hrefRe.exec(html)) !== null && hrefs.length < 300) hrefs.push(hm[1]);
  const pathOf = (h: string) => {
    try {
      return new URL(h, "https://x.test").pathname.toLowerCase();
    } catch {
      return h.toLowerCase();
    }
  };
  const PRICING_RE = /\/(pricing|prices?|cennik|ceny|preise?|tarifs?|tariffe|precios?|prix|prijzen|plans?|packages?|price-list|oferta)(\/|$|\?|#)/;
  const COMPARE_RE = /(\/vs\b|\/versus|\/comparison|\/compare|\/alternatives?|\/por[oó]wnanie|\/vergleich|\/comparaison|\/comparativa|\bvs\b.*\bvs\b)/;
  const pricingUrl = hrefs.find((h) => PRICING_RE.test(pathOf(h))) ?? null;
  const compareUrl = hrefs.find((h) => COMPARE_RE.test(pathOf(h))) ?? null;
  const has = (s: string) => lower.includes(s);
  const canonical =
    /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1] ??
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i.exec(html)?.[1] ??
    null;
  // Playbook signals: niche ownership, selection pages, verifiable claims.
  // v2: niche = 4 dimensions (customer, geography, size, constraint);
  // evidence = corrections contact, version history, downloadable data,
  // honest limitations (esp. on comparison pages).
  const hasIntegration = has("integration") || has("integrates with") || has("api docs") || has("api documentation");
  const hasSecurity = has("gdpr") || has("soc 2") || has("soc2") || has("iso 27001") || has("data residency") || has("data hosted") || has("security") || has("privacy policy");
  const hasComparison = has(" vs ") || has("versus") || has("alternative") || has("compare") || has("migrate from");
  const hasMethodology = has("methodology") || has("sample size") || has("n=") || has("limitations") || has("benchmark");
  const hasEvidence = has("case study") || has("customer") || has("testimonial") || has("review") || has("rating");
  const hasNiche = has("for ") && (has("teams") || has("agencies") || has("firms") || has("businesses") || has("startups"));
  const nicheDims =
    (has("for ") && (has("teams") || has("agencies") || has("firms") || has("businesses") || has("startups")) ? 1 : 0) +
    (/\b(germany|german|dach|france|french|uk\b|british|spain|spanish|poland|polish|europe|european|usa|american|austin|berlin|london)\b/.test(lower) ? 1 : 0) +
    (/\b\d+\s?(-|–|to)\s?\d+\s?(person|people|users|employees|seats)|under \d+|small (team|business)/.test(lower) ? 1 : 0) +
    (has("gdpr") || has("eu hosting") || has("eu data") || has("data residency") || has("whatsapp") || has("outlook") || has("datev") || has("integration") ? 1 : 0);
  const hasCorrections = has("corrections") || has("correction") || has("report an error") || has("media contact");
  const hasVersionHistory = has("changelog") || has("version history") || has("what's new") || has("release notes");
  const hasDownloadable = has("download") && (has("csv") || has("data") || has("report") || has("dataset"));
  const hasLimitations = has("limitation") || has("drawback") || has("however,") || has("where") && has("stronger");
  return {
    title,
    description: desc,
    wordCount,
    headings,
    images,
    links,
    pricingUrl,
    compareUrl,
    hasPricingPage: !!pricingUrl,
    hasComparePage: !!compareUrl,    hasSchema: has("application/ld+json") || has("itemscope") || has("schema.org"),
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
    canonical,
    hasIntegration,
    hasSecurity,
    hasComparison,
    hasMethodology,
    hasEvidence,
    hasNiche,
    nicheDims,
    hasCorrections,
    hasVersionHistory,
    hasDownloadable,
    hasLimitations,
  };
}

export type SiteTech = {
  robots: string | null;
  sitemapOk: boolean;
};

export function scoreUrl(url: string, html: string | null, loadMs: number, site?: SiteTech): GeoAuditResult {
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
        pricingUrl: null,
        compareUrl: null,
        hasPricingPage: false,
        hasComparePage: false,
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
        canonical: null,
        hasIntegration: false,
        hasSecurity: false,
        hasComparison: false,
        hasMethodology: false,
        hasEvidence: false,
        hasNiche: false,
        nicheDims: 0,
        hasCorrections: false,
        hasVersionHistory: false,
        hasDownloadable: false,
        hasLimitations: false,
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

  // 1. Crawlability & technical — playbook §5: indexable, canonical, sitemap,
  // AI crawlers explicitly allowed (incl. OAI-SearchBot, separate from GPTBot).
  const robots = (site?.robots ?? "").toLowerCase();
  const botAllowed = (bot: string) => {
    if (!site?.robots) return null; // unknown — robots.txt unfetchable
    const blocks = new RegExp(`user-agent:\\s*\\*[^]*?disallow:\\s*/`, "i").test(site.robots);
    const namedBlock = new RegExp(`user-agent:\\s*${bot}[^]*?disallow:\\s*/`, "i").test(robots);
    return !namedBlock && !blocks;
  };
  const bots = ["gptbot", "oai-searchbot", "perplexitybot", "claudebot"];
  const allowedBots = bots.filter((b) => botAllowed(b) === true);
  const blockedBots = bots.filter((b) => botAllowed(b) === false);
  let crawl = 55;
  if (fetched) crawl += 20;
  if (s.title) crawl += 8;
  if (s.description) crawl += 7;
  if (loadMs < 1500) crawl += 8;
  else if (loadMs < 3000) crawl += 4;
  if (s.canonical) crawl += 3;
  if (site?.sitemapOk) crawl += 3;
  if (blockedBots.length === 0 && site?.robots) crawl += 4;
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
      s.canonical ? `Canonical URL set: ${s.canonical.slice(0, 80)}` : "No canonical link — generative features need unambiguous canonicals",
      site?.sitemapOk ? "XML sitemap reachable — use IndexNow/Bing Webmaster for fast re-discovery" : "No XML sitemap found at /sitemap.xml — crawlers discover changes slower",
      site?.robots
        ? blockedBots.length
          ? `robots.txt blocks AI crawlers: ${blockedBots.join(", ")} — ChatGPT search needs OAI-SearchBot allowed (separate from GPTBot)`
          : `robots.txt allows AI crawlers${allowedBots.length ? ` (${allowedBots.join(", ")})` : ""}`
        : "Could not read robots.txt — verify AI crawlers (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot) are allowed",
    ],
    [
      "Add clean <title> (50–60 chars) + meta description (140–160 chars) on every key page",
      "Keep TTFB < 800ms, ensure no JS-only rendering for core content",
      "Set canonical URLs + publish /sitemap.xml; submit via Bing Webmaster Tools and IndexNow so pricing/docs changes are re-discovered fast",
      "Allow AI crawlers in robots.txt — including OAI-SearchBot for ChatGPT search (OpenAI treats it separately from GPTBot)",
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

  // 3. E-E-A-T / Authority — playbook §4: third-party validation beats
  // self-claims; methodology + caveats make benchmarks citable.
  let eeat = 40 + rand("e") * 20;
  if (s.hasAuthor) eeat += 10;
  if (s.hasDates) eeat += 8;
  if (s.hasQuotes) eeat += 6;
  if (s.wordCount > 800) eeat += 8;
  if (s.hasMethodology) eeat += 6;
  if (s.hasEvidence) eeat += 4;
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
      s.hasMethodology ? "Methodology/sample-size language detected — benchmarks look citable" : "No methodology or sample-size language — name how numbers were produced",
      s.hasEvidence ? "Customer proof signals (cases, reviews, ratings) detected" : "No customer-proof signals — add cases with sample size + timeframe",
      s.hasCorrections ? "Corrections/media contact present — errors are fixable, claims look maintained" : "No corrections contact — add one so claims stay trustworthy",
      s.hasVersionHistory ? "Version/changelog history detected" : "No version history — publish a changelog so updates are verifiable",
    ],
    [
      "Add author bios with credentials + link to LinkedIn",
      "Show Published / Updated dates, cite primary sources",
      "Add original data with a named methodology, sample size, and caveats — then earn third-party coverage of it",
    ]
  );

  // 4. Conversational / answer-ready — playbook §1–2: own a narrow category
  // and answer real selection questions (pricing, vs, migration, GDPR…).
  let conv = 35;
  if (s.hasQA) conv += 15;
  if (s.headings >= 4) conv += 12;
  if (s.hasLists) conv += 10;
  if (s.wordCount > 600 && s.wordCount < 4000) conv += 8;
  if (s.hasFAQ) conv += 8;
  if (s.hasNiche) conv += 5;
  // v2 niche depth: 0–4 dimensions (customer, geography, size, constraint).
  // A new brand wins by owning a narrow buying situation, not "best CRM".
  conv += Math.min(4, s.nicheDims) * 2;
  if (s.hasSecurity) conv += 4;
  if (s.hasIntegration) conv += 4;
  if (s.hasComparison) conv += 4;
  const convCat = mk(
    "answer",
    "Answer-Ready Content",
    conv + rand("a") * 8 - 4,
    0.25,
    [
      s.headings >= 4 ? `${s.headings} headings — decent question coverage` : `Only ${s.headings} headings — add question-style H2s`,
      ...(s.pricingUrl ? [`Pricing page linked: ${s.pricingUrl}`] : []),
      ...(s.compareUrl ? [`Comparison page linked: ${s.compareUrl}`] : []),
      s.hasNiche ? `Niche wedge present (${s.nicheDims}/4 dimensions: customer, geography, size, constraint)` : `No niche wedge detected (0/4) — new brands win narrow buying situations first, e.g. 'CRM for 5–25-person German recruitment agencies needing EU hosting'`,
      s.hasSecurity ? "Security/compliance signals detected (GDPR, SOC 2, residency)" : "No security/compliance content — 'Is it GDPR compliant?' and 'where is data hosted?' go unanswered",
      s.hasIntegration ? "Integration content detected" : "No integration content — 'does it integrate with X?' unanswered",
      s.hasComparison ? "Comparison/migration phrasing detected" : "No comparison phrasing — add honest vs/migration pages with measurable distinctions",
      s.hasLists ? "Lists detected (LLMs love step-by-step extraction)" : "No lists — add TL;DR + steps + pros/cons blocks",
      s.hasQA ? "Question phrasing detected" : "No direct Q&A phrasing — mirror how users prompt AI",
      s.wordCount > 0 ? `Density: ~${s.wordCount} words` : "No content analyzed",
    ],
    [
      "Start each key page with a 40–60 word direct answer (AI excerpt block)",
      "Add 'People also ask' style H2s: What / How much / Vs / Best / How to",
      "Keep paragraphs < 60 words, use bullets for facts",
      "Publish the selection set: pricing, vs-HubSpot, migration, integrations, GDPR/data-hosting — answer first, evidence after, never declare yourself the winner",
    ]
  );

  // 5. Freshness & reputation — playbook §4: validation must come from
  // third parties (press, partners, directories, reviewers), never self-claims.
  const fresh = 45 + rand("f") * 25 + (s.hasDates ? 10 : 0) + (s.hasEvidence ? 5 : 0);
  const freshCat = mk(
    "fresh",
    "Freshness & Reputation",
    fresh,
    0.1,
    [
      s.hasDates ? "Freshness signals present" : "No freshness signals",
      s.hasEvidence ? "Customer-proof signals present (cases, reviews)" : "No customer-proof signals on this page — reviewers need product access, data, and limitations to cite you",
      "Backlink velocity & review volume estimated from domain age heuristics",
      "Brand mention frequency across simulated AI corpora: " + (seed % 3 === 0 ? "low" : seed % 3 === 1 ? "moderate" : "emerging"),
    ],
    [
      "Update top 10 pages every 60–90 days with a changelog note",
      "Earn legitimate third-party validation: press, integration partners, customer case studies, associations, directories, podcasts — never bought reviews or disguised comparison sites",
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

  // Rank fixes by score gap × weight.
  const thinPage = fetched && s.wordCount < 50;
  const topActions = [
    ...(!s.hasSchema
      ? [{ title: "Add schema bundle (JSON-LD)", impact: "+12–18 pts", effort: "1–2 hrs", detail: "Organization + WebSite + FAQPage + Article. This is the single highest-leverage GEO fix." }]
      : []),
    ...(!s.hasFAQ
      ? [{ title: "Add AI excerpt & FAQ", impact: "+8–12 pts", effort: "45 min", detail: "40–60 word direct answer at top, then 5 question-style H2s with concise answers." }]
      : []),
    ...(!s.hasAuthor
      ? [{ title: "Add authorship & sources", impact: "+6–10 pts", effort: "30 min", detail: "Byline, credentials, publish date, 3+ outbound citations to primary sources." }]
      : []),
    ...(!s.hasPricingPage && !s.hasComparePage
      ? [{ title: "Publish comparison & pricing pages", impact: "+6–9 pts", effort: "2–4 hrs", detail: "AI engines cite '/vs', '/pricing', '/alternatives' pages heavily. Add tables." }]
      : []),
    ...(s.hasPricingPage && !s.hasComparePage
      ? [{ title: "Publish a comparison page", impact: "+4–6 pts", effort: "1–2 hrs", detail: `Pricing detected${s.pricingUrl ? ` at ${s.pricingUrl}` : ""} — now add the missing half: a '/vs' comparison with tables, which AI engines cite just as heavily.` }]
      : []),
    ...(!s.hasPricingPage && s.hasComparePage
      ? [{ title: "Publish a pricing page", impact: "+4–6 pts", effort: "1–2 hrs", detail: `Comparison content detected${s.compareUrl ? ` at ${s.compareUrl}` : ""} — now add transparent pricing with tables, the most-cited page type of all.` }]
      : []),
    ...(!s.hasCorrections || !s.hasVersionHistory
      ? [{ title: "Add corrections contact + version history", impact: "+3–5 pts", effort: "20 min", detail: "A corrections/media contact plus a changelog make every claim maintainable — the v2 evidence standard for citable pages." }]
      : []),
    ...(s.hasComparison && !s.hasLimitations
      ? [{ title: "Disclose where competitors are stronger", impact: "+3–5 pts", effort: "30 min", detail: "Comparison page detected but no honest limitations. Naming where rivals win makes the page far more credible — and more cited — than winner-declaring." }]
      : []),
    { title: "Earn 5 third-party mentions", impact: "+5–10 pts", effort: "Ongoing", detail: "Reddit, G2, Capterra, Quora, niche blogs — LLMs memorize these corpora." },
    { title: "Publish llms.txt & allow AI bots", impact: "+4–7 pts", effort: "20 min", detail: "Whitelist GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot in robots.txt; publish /llms.txt for assistant crawlers. Note: Google says its AI features need no special markup — indexability is what matters there." },
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

export function buildBusinessPrompts(brand: string, domain: string, text: string): string[] {
  const clean = brand.trim() || "the business";
  const bare = domain.replace(/^www\./, "").split(".")[0];
  // Offering: first substantive sentence of the page (hero copy), skipping
  // nav-crumb lines (separator runs like * | › ») that carry no meaning.
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 30);
  const meaningful = (l: string) =>
    !/[*|›»«]{2,}/.test(l) && /[a-zżźćńółęąś]{4,}/.test(l.toLowerCase());
  const hero =
    lines.find((l) => meaningful(l) && /[.!?]$/.test(l)) ??
    lines.find((l) => meaningful(l)) ??
    "";
  const firstLine = hero.slice(0, 90);
  const words = firstLine.split(/\s+/).filter(Boolean);
  const shortOffering = words.length > 7 ? words.slice(0, 7).join(" ") + "…" : firstLine || `${clean} services`;
  // Location hint: "in <Place>" pattern from the copy.
  const loc = /bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/.exec(text)?.[1] ?? "";
  const where = loc ? ` in ${loc}` : "";
  return [
    `What is the best ${shortOffering} for small business — ${clean} or alternatives?`,
    `Is ${clean} reliable${where}? Reviews and pricing?`,
    `${clean} vs competitors — which should I choose?`,
    `How much does ${clean}${where} cost?`,
    `What do people say about ${bare}${where} online?`,
  ];
}

export function simulatePromptTests(brand: string, domain: string, customPrompts?: string[]) {
  const list = (customPrompts ?? []).map((p) => String(p).trim()).filter(Boolean).slice(0, 10);
  const prompts = list.length ? list : [
    `What is the best ${brand} alternative for small business?`,
    `Is ${brand} reliable? Reviews and pricing?`,
    `${brand} vs competitors — which should I choose?`,
    `How much does ${brand} cost?`,
    `What do people say about ${domain} on Reddit?`,
  ];
  const engines = ["ChatGPT", "Perplexity", "Gemini", "Claude", "Copilot"];
  const seed = hashStr(brand + domain);
  const CATS = ["Comparison", "Reputation", "Comparison", "Pricing", "Reputation"];
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
      category: CATS[i % CATS.length],
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
