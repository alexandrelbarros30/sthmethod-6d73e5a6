# Regras de Versionamento — STH METHOD

Formato: **MAJOR.MINOR.PATCH** (SemVer adaptado ao produto).
O `PATCH` é preenchido automaticamente pelo GitHub Actions (`run_number`).
`MAJOR` e `MINOR` são bumpados manualmente em `package.json` conforme as regras abaixo.

---

## 1. MAJOR (X.0.0) — impacto alto / disruptivo
Requer comunicação prévia ao aluno/consultor.
- Reescrita completa de módulo central (Dieta, Treino, Protocolo, Auth, Pagamentos).
- Mudança de BD com quebra de compatibilidade.
- Nova identidade visual global / rebranding.
- Troca de provedor crítico (IA, Pagamento, Push, Storage).
- Remoção de feature em produção usada por alunos.

## 2. MINOR (1.X.0) — impacto médio / novas capacidades (sem quebra)
- Novo módulo/feature completo (Web Push, Central de Análise, Cardápio IA).
- Novo painel admin ou rota pública relevante.
- Novo canal de IA (STHIA Medical, Elite Coach).
- Integração externa nova (SuperCoach, FatSecret, VAPID).
- Conjunto de 5+ melhorias funcionais no mesmo ciclo.

## 3. PATCH (1.1.X) — baixo / correções e polimento (automático via CI)
- Bugfix, ajuste de UI/UX/copy, performance, hotfix de segurança sem mudança de contrato.
- CI calcula: `MAJOR.MINOR.${github.run_number}`.

---

## 4. Classificação por impacto

| Nível | Bump | Comunicação ao aluno | Changelog |
|-------|------|----------------------|-----------|
| 🔴 Crítico | MAJOR | Banner + push + e-mail | Detalhado |
| 🟡 Relevante | MINOR | Banner in-app + push opcional | Títulos |
| 🟢 Manutenção | PATCH | Silencioso | Opcional |

> Nunca mencionar IA, GitHub, Lovable ou stack técnica nos textos públicos — apenas títulos das melhorias.

---

## 5. Quantidade acumulada força bump
- **10+ PATCHes** desde o último MINOR ⇒ promover a MINOR.
- **5+ MINORs** desde o último MAJOR ⇒ avaliar MAJOR.
- Qualquer mudança que altere fluxo do aluno (onboarding, pagamento, treino guiado, evolução) ⇒ **mínimo MINOR**.

---

## 6. Como aplicar
1. Editar `package.json` → `version` = MAJOR.MINOR.0 (o `0` é substituído pelo CI).
2. Atualizar `public/version.json` com o mesmo valor.
3. Registrar em `/sobre` e em `platform_updates` (admin `/admin/updates`) com tipo `patch | minor | major`.
4. Commit em `main` → Actions publica APK/AAB com `versionName` sincronizado.

---

## 7. Estado atual
- **1.1.0** — ciclo Web Push + Campanhas + Agendamento + Prévia + Histórico + máscara de erros STH-XXX + Missão Evolução gamificada.
- Próximo PATCH automático: `1.1.<run_number>`.
- Próximo MINOR (`1.2.0`): próximo módulo completo (ex.: APNs iOS, novo canal IA, novo painel).
