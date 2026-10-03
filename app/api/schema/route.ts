import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Builds a copy-paste JSON-LD schema bundle (Organization + WebSite +
// FAQPage + Product/Article) — the highest-leverage GEO fix.
const Body = z.object({
  brand: z.string().default("Acme"),
  domain: z.string().default("acme.com"),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  kind: z.enum(["LocalBusiness", "SoftwareApplication", "Product", "Article"]).default("SoftwareApplication"),
});

export async function POST(req: NextRequest) {
  const body = Body.parse(await req.json().catch(() => ({})));
  const faqs = body.faqs.length
    ? body.faqs
    : [
        { q: `What does ${body.brand} do?`, a: `${body.brand} helps customers with transparent pricing and verified reviews.` },
        { q: `How much does ${body.brand} cost?`, a: `See https://${body.domain}/pricing for current plans.` },
      ];
  const bundle = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: body.brand,
        url: `https://${body.domain}/`,
        logo: `https://${body.domain}/logo.png`,
        sameAs: [],
      },
      { "@type": "WebSite", name: body.brand, url: `https://${body.domain}/` },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      { "@type": body.kind, name: body.brand, url: `https://${body.domain}/`, aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "320" } },
    ],
  };
  const workerSnippet = `// Cloudflare Worker: auto-inject JSON-LD on every HTML page
// 1) Save the bundle above as a Worker secret/variable JSONLD
// 2) Deploy this worker in front of your origin:
export default {
  async fetch(req, env) {
    const res = await fetch(req);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return res;
    let html = await res.text();
    const tag = '<script type="application/ld+json">' + JSON.stringify(env.JSONLD) + "</" + "script>";
    html = html.replace("</head>", tag + "</head>");
    return new Response(html, res);
  }
};`;
  return NextResponse.json({ bundle, workerSnippet });
}
