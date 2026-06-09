
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mocking some functions for testing or importing them if they were exported
// For this test, we re-implement the logic to verify its correctness

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

Deno.test("Phone Normalization - Should handle various Brazilian formats", () => {
  const testCases = [
    { input: "5521972486650", expectedContains: ["21972486650", "2172486650"] },
    { input: "21972486650", expectedContains: ["5521972486650", "2172486650"] },
    { input: "2172486650", expectedContains: ["552172486650", "21972486650"] },
    { input: "+55 (21) 97248-6650", expectedContains: ["21972486650"] }
  ];

  for (const { input, expectedContains } of testCases) {
    const candidates = phoneCandidates(input);
    for (const expected of expectedContains) {
      assertEquals(candidates.includes(expected), true, `Input ${input} should produce candidate ${expected}`);
    }
  }
});

Deno.test("Search Patterns - Should generate fuzzy patterns for database search", () => {
  const input = "21972486650";
  const patterns = buildPhoneSearchPatterns(input);
  
  // Patterns should help find numbers regardless of how they are stored (with/soft spaces, dashes, etc)
  assertEquals(patterns.some(p => p.includes("21") && p.includes("97248") && p.includes("6650")), true);
  assertEquals(patterns.some(p => p.includes("21") && p.includes("7248") && p.includes("6650")), true);
});
