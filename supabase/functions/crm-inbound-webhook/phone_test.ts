
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mocking functions from index.ts logic
function digitsOnly(raw: string | null | undefined): string {
  if (!raw) return '';
  const clean = String(raw).split('@')[0];
  return clean.replace(/\D+/g, '').replace(/^0+/, '');
}

function buildInternalPhones(_configuredInstances: { zapi: string; wapi: string; wapi_sucesso: string }, connectedPhone: string): Set<string> {
  const numbers = new Set<string>();
  const hardcodedKnownInternalNumbers = [
    '5521998984153',
    '5521998496289',
    '5521972486650',
  ];

  for (const raw of [connectedPhone, ...hardcodedKnownInternalNumbers]) {
    const digits = digitsOnly(raw);
    if (digits) numbers.add(digits);
  }

  return numbers;
}

function normalizePhone(raw: string): string {
  let clean = String(raw || '').split('@')[0];
  let d = clean.replace(/\D+/g, '').replace(/^0+/, '');
  if (d.length === 10 || d.length === 11) return '55' + d;
  if (d.startsWith('550')) d = '55' + d.substring(3);
  return d;
}

function phoneCandidates(d: string): string[] {
  if (!d) return [];
  const digits = digitsOnly(d);
  const set = new Set<string>([digits]);
  
  if (digits.startsWith('55') && digits.length > 10) {
    const sans55 = digits.slice(2);
    set.add(sans55);
    const ddd = sans55.slice(0, 2);
    const rest = sans55.slice(2);
    if (rest.length === 9 && rest[0] === '9') set.add(ddd + rest.slice(1));
    if (rest.length === 8) set.add(ddd + '9' + rest);
  } else if (digits.length >= 8) {
    set.add('55' + digits);
    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);
    if (rest.length === 9 && rest[0] === '9') set.add(ddd + rest.slice(1));
    if (rest.length === 8) set.add(ddd + '9' + rest);
  }
  return Array.from(set);
}

function phoneMatchScore(row: any, targetPhone: string, targetWaId: string | null): number {
  const candidate = digitsOnly(row.phone);
  const candidateWaId = row.whatsapp_id;
  const target = digitsOnly(targetPhone);
  
  if (targetWaId && candidateWaId === targetWaId) return 1000;
  if (!candidate || !target) return 0;
  if (candidate === target) return 100;
  
  const c8 = candidate.slice(-8);
  const t8 = target.slice(-8);
  
  if (c8 === t8) {
    const getDDD = (s: string) => {
      const sansDDI = s.startsWith('55') ? s.slice(2) : s;
      return sansDDI.slice(0, 2);
    };
    
    const cDDD = getDDD(candidate);
    const tDDD = getDDD(target);
    
    if (cDDD === tDDD) {
       if (candidate.slice(-11) === target.slice(-11)) return 95;
       if (candidate.slice(-10) === target.slice(-10)) return 90;
       return 85;
    }
    return 60;
  }
  return 0;
}

Deno.test("Phone Normalization - Should handle leading zeros and WhatsApp formats", () => {
  assertEquals(normalizePhone("021972486650"), "5521972486650");
  assertEquals(normalizePhone("5521972486650@s.whatsapp.net"), "5521972486650");
  assertEquals(normalizePhone("55021972486650"), "5521972486650");
});

Deno.test("Phone Candidates - Should handle various Brazilian formats", () => {
  const testCases = [
    { input: "5521972486650", expectedContains: ["21972486650", "2172486650"] },
    { input: "21972486650", expectedContains: ["5521972486650", "2172486650"] },
    { input: "2172486650", expectedContains: ["552172486650", "21972486650"] },
    { input: "+55 (21) 97248-6650", expectedContains: ["21972486650"] },
    { input: "556493070839", expectedContains: ["64993070839", "6493070839"] }
  ];

  for (const { input, expectedContains } of testCases) {
    const candidates = phoneCandidates(input);
    for (const expected of expectedContains) {
      assertEquals(candidates.includes(expected), true, `Input ${input} should produce candidate ${expected}. Got: ${candidates.join(', ')}`);
    }
  }
});

Deno.test("Phone Match Score - Should prioritize whatsapp_id", () => {
  const row = { phone: "5521972486650", whatsapp_id: "WID123" };
  
  // exact waId match
  assertEquals(phoneMatchScore(row, "551188888888", "WID123"), 1000);
  
  // exact phone match
  assertEquals(phoneMatchScore(row, "5521972486650", null), 100);
  
  // 9th digit variation
  assertEquals(phoneMatchScore(row, "552172486650", null), 85);
});

Deno.test("Internal phones - Should treat operation numbers as self echo", () => {
  const internalPhones = buildInternalPhones(
    { zapi: "zapi-instance", wapi: "wapi-instance", wapi_sucesso: "wapi-sucesso-instance" },
    "5521998984153",
  );

  assertEquals(internalPhones.has("5521998984153"), true);
  assertEquals(internalPhones.has("5521998496289"), true);
  assertEquals(internalPhones.has("5521972486650"), true);
  assertEquals(internalPhones.has("5511999999999"), false);
});
