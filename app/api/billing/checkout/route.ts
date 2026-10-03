import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_IDS } from "@/lib/billing";

export async function POST(req: NextRequest) {
  const { plan = "GROWTH", email } = await req.json().catch(() => ({}));
  const stripe = getStripe();
  const priceId = PRICE_IDS[plan];

  // Demo mode: no Stripe keys or no price IDs → return mock checkout.
  if (!stripe || !priceId) {
    return NextResponse.json({
      mode: "demo",
      url: `/dashboard?plan=${plan}&checkout=demo`,
      message: "Stripe not configured — demo checkout. Add STRIPE_SECRET_KEY + price IDs to go live.",
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?checkout=cancelled`,
    metadata: { plan },
  });
  return NextResponse.json({ mode: "live", url: session.url });
}
