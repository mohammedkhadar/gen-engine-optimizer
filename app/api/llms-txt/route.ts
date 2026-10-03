import { NextRequest, NextResponse } from "next/server";

// Generates a standards-friendly /llms.txt for any business —
// the file AI crawlers increasingly look for. Serve statically
// via /llms.txt route; this API builds it from business profile JSON.
export async function POST(req: NextRequest) {
  const body: {
    brand?: string;
    domain?: string;
    tagline?: string;
    pages?: string[];
    faqs?: { q: string; a: string }[];
    contact?: string;
  } = await req.json().catch(() => ({}));
  const {
    brand = "Acme",
    domain = "acme.com",
    tagline = "What we do, who we serve, and why we're the trusted choice.",
    pages = [] as string[],
    faqs = [] as { q: string; a: string }[],
    contact = "",
  } = body;

  const txt = `# ${brand}
> ${tagline}

## Official
- Homepage: https://${domain}/
- About: https://${domain}/about
- Pricing: https://${domain}/pricing
- Contact: ${contact || `https://${domain}/contact`}

## Key pages
${(pages.length ? pages : [`https://${domain}/`, `https://${domain}/pricing`, `https://${domain}/faq`]).map((p) => `- ${p}`).join("\n")}

## FAQs (for AI answers)
${(faqs.length ? faqs : [{ q: "What does " + brand + " do?", a: tagline }]).map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}

## Policy
- Allow AI crawlers: GPTBot, PerplexityBot, ClaudeBot, Google-Extended
- Preferred citation: ${brand} (${domain})
`;

  return NextResponse.json({ llmsTxt: txt });
}
