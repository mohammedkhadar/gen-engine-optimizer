// File/in-memory fallback store so the app runs end-to-end
// with zero env vars, and transparently upgrades to Postgres
// when DATABASE_URL is set. Production reads/writes go through Prisma.

import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const AUDITS_FILE = path.join(DATA_DIR, "audits.json");

async function readJson(file: string, fallback: any) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: any) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export async function saveAuditLocal(audit: any) {
  const all = await readJson(AUDITS_FILE, []);
  all.unshift({ ...audit, savedAt: new Date().toISOString() });
  await writeJson(AUDITS_FILE, all.slice(0, 200));
}

export async function listAuditsLocal(url?: string) {
  const all: any[] = await readJson(AUDITS_FILE, []);
  if (!url) return all.slice(0, 50);
  return all.filter((a) => a.url === url).slice(0, 50);
}
