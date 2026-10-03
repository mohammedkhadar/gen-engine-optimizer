import Stripe from "stripe";

export const hasStripe = !!process.env.STRIPE_SECRET_KEY;

let stripe: Stripe | null = null;
export function getStripe() {
  if (!hasStripe) return null;
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
  return stripe;
}

// Map app plans -> Stripe Price IDs (set in env; fallback to mock checkout in demo).
export const PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  GROWTH: process.env.STRIPE_PRICE_GROWTH,
  SCALE: process.env.STRIPE_PRICE_SCALE,
};

export const PLANS = [
  { id: "STARTER", name: "Starter", price: 29, prompts: 50, domains: 1 },
  { id: "GROWTH", name: "Growth", price: 79, prompts: 500, domains: 3 },
  { id: "SCALE", name: "Scale", price: 199, prompts: 999999, domains: 10 },
];
