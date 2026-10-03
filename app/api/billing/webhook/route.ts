import { NextRequest, NextResponse } from "next/server";
import { getStripe, hasStripe } from "@/lib/billing";
import { prisma, hasDatabase } from "@/lib/db";

// Stripe webhook: checkout.session.completed → subscription created/updated.
export async function POST(req: NextRequest) {
  if (!hasStripe) return NextResponse.json({ ok: true, mode: "demo" });
  const stripe = getStripe()!;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  if (hasDatabase) {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as any;
      const email = s.customer_email || s.customer_details?.email;
      if (email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { plan: (s.metadata?.plan as any) ?? "GROWTH", stripeCustomerId: String(s.customer ?? user.stripeCustomerId ?? "") },
          });
        }
      }
    }
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      await prisma.subscription.deleteMany({ where: { stripeSubscriptionId: sub.id } });
    }
  }
  return NextResponse.json({ received: true });
}
