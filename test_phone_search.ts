
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function digitsOnly(raw: string | null | undefined): string {
  return String(raw || '').replace(/\D+/g, '').replace(/^0+/, '');
}

function phoneCandidates(d: string): string[] {
  if (!d) return [];
  const digits = digitsOnly(d);
  const set = new Set<string>([digits]);
  
  if (digits.startsWith('55') && digits.length > 10) {
    const sans55 = digits.slice(2);
    set.add(sans55);
    if (sans55.length === 11 && sans55[2] === '9') set.add(sans55.slice(0, 2) + sans55.slice(3));
    if (sans55.length === 10) set.add(sans55.slice(0, 2) + '9' + sans55.slice(2));
  } else {
    set.add('55' + digits);
    if (digits.length === 11 && digits[2] === '9') set.add(digits.slice(0, 2) + digits.slice(3));
    if (digits.length === 10) set.add(digits.slice(0, 2) + '9' + digits.slice(2));
  }
  
  return Array.from(set);
}

function phoneMatchScore(candidatePhone: string | null | undefined, targetPhone: string): number {
  const candidate = digitsOnly(candidatePhone);
  const target = digitsOnly(targetPhone);
  if (!candidate || !target) return 0;
  if (candidate === target) return 100;
  if (candidate.length >= 11 && target.length >= 11 && candidate.slice(-11) === target.slice(-11)) return 80;
  if (candidate.length >= 10 && target.length >= 10 && candidate.slice(-10) === target.slice(-10)) return 60;
  return 0;
}

function buildPhoneSearchPatterns(phone: string): string[] {
  const patterns = new Set<string>();

  for (const variant of phoneCandidates(phone)) {
    const digits = digitsOnly(variant);
    const local = digits.startsWith('55') ? digits.slice(2) : digits;
    if (local.length < 10) continue;

    const ddd = local.slice(0, 2);
    const middle = local.slice(2, -4);
    const last4 = local.slice(-4);

    patterns.add(`%${ddd}%${middle}%${last4}%`);
    patterns.add(`%${middle}%${last4}%`);
  }

  return Array.from(patterns);
}

async function findProfileByPhone(phone: string) {
  const patterns = buildPhoneSearchPatterns(phone);
  console.log('Patterns:', patterns);
  if (!patterns.length) return null;

  let query = admin.from('profiles').select('*').not('phone', 'is', null);
  query = query.or(patterns.map((pattern) => `phone.ilike.${pattern}`).join(','));

  const { data, error } = await query.limit(20);
  if (error) throw error;

  const ranked = (data || [])
    .map((row: any) => ({ ...row, _score: phoneMatchScore(row.phone, phone), _digits: digitsOnly(row.phone) }))
    .filter((row: any) => row._score > 0)
    .sort((a: any, b: any) => b._score - a._score || b._digits.length - a._digits.length);

  return ranked[0] ?? null;
}

// Test with one of the phones from the DB: (21) 97708-1940
const testPhone = '5521977081940';
const profile = await findProfileByPhone(testPhone);
console.log('Found profile:', profile ? profile.full_name : 'NOT FOUND');
if (profile) {
  const { data: subs } = await admin.from('subscriptions').select('*').eq('user_id', profile.user_id).order('end_date', { ascending: false }).limit(1);
  console.log('Subscription:', subs);
}
