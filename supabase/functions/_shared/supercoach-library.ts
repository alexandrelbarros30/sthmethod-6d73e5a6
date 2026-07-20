// Busca a biblioteca de exercícios do ST Coach com cache em memória por 30min.
// Retorna lista compacta (id, name, video_url, cover_url).

const LOGIN_URL = 'https://supertreinosapp.com/api/v2/user/login';
const LIBRARY_URL = 'https://supertreinosapp.com/api/v2/library?pid=';
const LIBRARY_RAW_URL = 'https://supertreinosapp.com/api/v2/library?pid=';

const COMMON_HEADERS = {
  'accept': 'application/json, text/plain, */*',
  'content-type': 'application/json',
  'custom-origin': 'adm-site',
  'origin': 'https://adm.appsupercoach.com',
  'referer': 'https://adm.appsupercoach.com/',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36',
};

export interface ScLibExercise {
  id: number | string;
  name: string;
  description?: string;
  video_url?: string;
  cover_url?: string | null;
  muscle_ids?: any[];
  equip_ids?: any[];
}

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedLibrary: { list: ScLibExercise[]; expiresAt: number } | null = null;
let cachedRawLibrary: { list: any[]; expiresAt: number } | null = null;

export async function getSuperCoachToken(): Promise<string> {
  return await getToken();
}

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const email = Deno.env.get('SUPERCOACH_EMAIL');
  const password = Deno.env.get('SUPERCOACH_PASSWORD');
  if (!email || !password) throw new Error('SUPERCOACH_EMAIL / SUPERCOACH_PASSWORD não configurados');
  const res = await fetch(LOGIN_URL, {
    method: 'POST', headers: COMMON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ST Coach login (${res.status}): ${text.slice(0, 160)}`);
  const json = JSON.parse(text);
  const token = json?.access_token || json?.token || json?.data?.access_token;
  if (!token) throw new Error('Token ST Coach ausente');
  cachedToken = { token, expiresAt: Date.now() + 30 * 60_000 };
  return token;
}

export async function getSuperCoachLibrary(): Promise<ScLibExercise[]> {
  if (cachedLibrary && cachedLibrary.expiresAt > Date.now()) return cachedLibrary.list;
  const token = await getToken();
  const r = await fetch(LIBRARY_URL, { headers: { ...COMMON_HEADERS, authorization: `Bearer ${token}` } });
  const text = await r.text();
  if (!r.ok) throw new Error(`ST Coach library (${r.status}): ${text.slice(0, 160)}`);
  const j = JSON.parse(text);
  const list = j?.workouts || j?.data || j?.library || [];
  const exercises: ScLibExercise[] = (Array.isArray(list) ? list : []).map((w: any) => ({
    id: w.id,
    name: w.name || '',
    description: w.description || '',
    video_url: w.video_url || '',
    cover_url: w.cover_url || null,
    muscle_ids: w.workout_muscle_ids || [],
    equip_ids: w.workout_equip_ids || [],
  })).filter((e) => e.name);
  cachedLibrary = { list: exercises, expiresAt: Date.now() + 30 * 60_000 };
  return exercises;
}

// Retorna a biblioteca COMPLETA (objetos crus) — necessário para POST /library/copy
// que exige o objeto integral da lib (muscle_ids como objetos, translations, etc.).
export async function getSuperCoachLibraryRaw(): Promise<any[]> {
  if (cachedRawLibrary && cachedRawLibrary.expiresAt > Date.now()) return cachedRawLibrary.list;
  const token = await getToken();
  const r = await fetch(LIBRARY_RAW_URL, { headers: { ...COMMON_HEADERS, authorization: `Bearer ${token}` } });
  const text = await r.text();
  if (!r.ok) throw new Error(`ST Coach library raw (${r.status}): ${text.slice(0, 160)}`);
  const j = JSON.parse(text);
  const list = j?.workouts || j?.data || j?.library || (Array.isArray(j) ? j : []);
  const arr = Array.isArray(list) ? list : [];
  cachedRawLibrary = { list: arr, expiresAt: Date.now() + 30 * 60_000 };
  return arr;
}

export const SC_COMMON_HEADERS = COMMON_HEADERS;

export function normalizeExName(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}