// Per-user audit cache. The browser cache AND the server history fallback are
// both scoped to the signed-in account, so a new user on shared hardware
// never sees the previous user's report. Logged-out usage keys to "anon".

const LEGACY_KEY = "rankai:lastAudit";
const USER_KEY = "rankai:lastUser";

export const auditCacheKey = (email: string | null) => `rankai:lastAudit:${email ?? "anon"}`;

export async function sessionEmail(): Promise<string | null> {
  try {
    const r = await fetch("/api/auth/session");
    if (!r.ok) return null;
    const s = await r.json();
    return s?.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function loadCachedAudit(): Promise<any | null> {
  const email = await sessionEmail();
  const who = email ?? "anon";
  try {
    const last = localStorage.getItem(USER_KEY);
    if (last && last !== who) {
      // Account switched: drop the previous account's cached report.
      localStorage.removeItem(auditCacheKey(last === "anon" ? null : last));
      localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(USER_KEY, who);
      return null;
    }
    localStorage.setItem(USER_KEY, who);
    const raw = localStorage.getItem(auditCacheKey(email));
    if (raw) return JSON.parse(raw);
    // one-time read of the pre-scoping key (same device, same account era)
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const data = JSON.parse(legacy);
      localStorage.setItem(auditCacheKey(email), legacy);
      localStorage.removeItem(LEGACY_KEY);
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

// Legacy topActions stored before deep-links existed: resolve the same
// generator links by title (including pre-rename variants) so old cached
// audits don't fall back to looping on the audit page.
const GEN = "/dashboard/content";
const LEGACY_FIX_LINKS: Record<string, { link: string; linkLabel: string }> = {
  "Add schema bundle (JSON-LD)": { link: GEN, linkLabel: "Generate the bundle →" },
  "Add JSON-LD schema bundle": { link: GEN, linkLabel: "Generate the bundle →" },
  "Add AI excerpt & FAQ": { link: GEN, linkLabel: "Generate excerpt + FAQs →" },
  "Add an AI excerpt + FAQ block": { link: GEN, linkLabel: "Generate excerpt + FAQs →" },
  "Add AI excerpt + FAQ block": { link: GEN, linkLabel: "Generate excerpt + FAQs →" },
  "Allow AI crawlers + llms.txt": { link: GEN, linkLabel: "Generate my llms.txt →" },
  "Publish llms.txt & allow AI bots": { link: GEN, linkLabel: "Generate my llms.txt →" },
  "Publish /llms.txt + allow AI bots": { link: GEN, linkLabel: "Generate my llms.txt →" },
  "Add authorship & sources": { link: GEN, linkLabel: "Open content optimizer →" },
};

export function fixLink(a: { title?: string; link?: string; linkLabel?: string }) {
  if (a?.link) return { link: a.link, linkLabel: a.linkLabel ?? "Fix now →" };
  const legacy = (a?.title && LEGACY_FIX_LINKS[a.title]) || null;
  if (legacy) return legacy;
  // No generator for this fix: render no link rather than a loop back here.
  return null;
}

export async function saveCachedAudit(data: any) {
  const email = await sessionEmail();
  try {
    localStorage.setItem(USER_KEY, email ?? "anon");
    localStorage.setItem(auditCacheKey(email), JSON.stringify(data));
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
