import { recalcDietMacros } from './_shared/diet-macros.ts';

// Test cases for deterministic macro calculation
const testCases = [
  {
    name: "Standard Meal",
    text: "150g de arroz branco + 120g de peito de frango + 100g de feijao",
    expected: { p: 46, c: 56, f: 5 } // (150/100*2.5 + 120/100*32 + 100/100*4.8) = 3.75 + 38.4 + 4.8 = 46.95 -> 47?
    // Let's re-verify with the exact TABLE values from diet-macros.ts:
    // arroz branco: p: 2.5, c: 28.1, f: 0.2
    // peito de frango: p: 32.0, c: 0, f: 3.0
    // feijao: p: 4.8, c: 13.6, f: 0.5
    // P: 1.5*2.5 (3.75) + 1.2*32 (38.4) + 1.0*4.8 (4.8) = 46.95 -> round -> 47
    // C: 1.5*28.1 (42.15) + 1.2*0 (0) + 1.0*13.6 (13.6) = 55.75 -> round -> 56
    // F: 1.5*0.2 (0.3) + 1.2*3 (3.6) + 1.0*0.5 (0.5) = 4.4 -> round -> 4
    // Kcal: 47*4 + 56*4 + 4*9 = 188 + 224 + 36 = 448
  },
  {
    name: "Egg Units",
    text: "3 ovos inteiros + 2 claras",
    // 1 ovo = 50g, 1 clara = 33g
    // 3 ovos = 150g (ovo: p: 13.3, c: 0.6, f: 9.5) -> P: 1.5*13.3=19.95, C: 1.5*0.6=0.9, F: 1.5*9.5=14.25
    // 2 claras = 66g (clara: p: 11.0, c: 0.7, f: 0.2) -> P: 0.66*11=7.26, C: 0.66*0.7=0.462, F: 0.66*0.2=0.132
    // Sum P: 19.95 + 7.26 = 27.21 -> 27
    // Sum C: 0.9 + 0.46 = 1.36 -> 1
    // Sum F: 14.25 + 0.13 = 14.38 -> 14
    // Kcal: 27*4 + 1*4 + 14*9 = 108 + 4 + 126 = 238
  }
];

console.log("Running STHia Macro Audit...");
testCases.forEach(tc => {
  const html = `<p><strong>Refeição 01: Test</strong></p><p><strong>100 kcal · P 10 g / C 10 g / G 2 g</strong></p><p><strong>"⭐ BASE:</strong> ${tc.text}<strong>"</strong></p>`;
  const result = recalcDietMacros(html);
  console.log(`\nTest: ${tc.name}`);
  console.log(`Input Text: ${tc.text}`);
  console.log(`Result HTML: ${result.html.match(/(\d+ kcal · P \d+g \/ C \d+g \/ G \d+g)/)?.[1]}`);
});
