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

export async function saveCachedAudit(data: any) {
  const email = await sessionEmail();
  try {
    localStorage.setItem(USER_KEY, email ?? "anon");
    localStorage.setItem(auditCacheKey(email), JSON.stringify(data));
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
