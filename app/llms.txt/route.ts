// Default /llms.txt — customers replace this with the generator output
// (Dashboard → Content Optimizer, or POST /api/llms-txt).
export async function GET() {
  const brand = process.env.SITE_BRAND ?? "RankAI GEO";
  const domain = process.env.SITE_DOMAIN ?? "rankai.geo";
  const txt = `# ${brand}
> Generative Engine Optimization platform — get cited by ChatGPT, Perplexity, Gemini, Claude and Google AI Overviews.

## Official
- Homepage: https://${domain}/
- GEO Audit: https://${domain}/dashboard/audit
- Pricing: https://${domain}/pricing

## Policy
- Allow AI crawlers: GPTBot, PerplexityBot, ClaudeBot, Google-Extended
`;
  return new Response(txt, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
