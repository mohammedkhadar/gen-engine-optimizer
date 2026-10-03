// Manual daily-check runner (alternative to Vercel Cron / pg_cron).
// Usage: CRON_SECRET=xxx BASE_URL=https://your-app.com npm run cron:daily
const base = process.env.BASE_URL || "http://localhost:3000";
const secret = process.env.CRON_SECRET || "";

async function main() {
  const res = await fetch(`${base}/api/cron/daily?secret=${secret}`);
  console.log(res.status, await res.text());
}
main();
