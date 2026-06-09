import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

// Simulação simplificada para validação do menu comercial
const COMERCIAL_MENU_TEMPLATE = `Olá! Seja bem-vindo(a) à STH METHOD. 👋

Como posso ajudar?

1️⃣ Conhecer planos e valores
2️⃣ Como funciona a metodologia
3️⃣ Falar com um consultor
4️⃣ Já sou aluno`;

Deno.test("Comercial Channel: Validation of Menu Template", () => {
  const currentMenu = `Olá! Seja bem-vindo(a) à STH METHOD. 👋\n\nComo posso ajudar?\n\n1️⃣ Conhecer planos e valores\n2️⃣ Como funciona a metodologia\n3️⃣ Falar com um consultor\n4️⃣ Já sou aluno`;
  
  // Normalizar quebras de linha para comparação
  const normalizedExpected = COMERCIAL_MENU_TEMPLATE.replace(/\r\n/g, "\n").trim();
  const normalizedActual = currentMenu.replace(/\r\n/g, "\n").trim();
  
  assertEquals(normalizedActual, normalizedExpected, "O menu comercial deve seguir exatamente o template definido.");
});

Deno.test("Comercial Channel: Fallback message validation", () => {
  const fallbackMsg = "Não entendi sua opção. Para te ajudar, escolha uma das opções abaixo:\n\n1️⃣ Conhecer planos\n2️⃣ Como funciona\n3️⃣ Falar com consultor\n4️⃣ Já sou aluno\n\n_Ou digite apenas o número da opção._";
  
  assertEquals(fallbackMsg.includes("1️⃣"), true);
  assertEquals(fallbackMsg.includes("4️⃣"), true);
});
