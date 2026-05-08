# Sistema de Atualização da Plataforma

## Objetivo
Padronizar e automatizar o processo de atualização da plataforma (hoje em **Beta 3.5.0**), com três níveis de impacto, registro histórico no banco e banner de atualização que respeita o que o usuário já viu.

## Modelo de Versionamento (SemVer adaptado)

Formato: `Beta MAJOR.MINOR.PATCH`

| Tipo | O que é | Como muda a versão | Exemplo |
|---|---|---|---|
| **Pequena** (patch) | Correções de bug, ajustes visuais, textos | `3.5.0 → 3.5.1` | Corrigir card sumindo |
| **Média** (minor) | Nova funcionalidade compatível, melhorias notáveis | `3.5.1 → 3.6.0` | Novo card de Medicamentos |
| **Grande** (major) | Mudança estrutural, refatoração visível, quebra de fluxo | `3.6.0 → 4.0.0` | Novo dashboard segmentado |

## Componentes

### 1. Tabela `platform_updates` (banco)
Guarda histórico completo de cada atualização:
- `version` (ex: "3.5.1")
- `impact` ("patch" | "minor" | "major")
- `title` (curto, ex: "Card de Medicamentos")
- `description` (changelog para o usuário, multilinha)
- `released_at` (timestamp)
- `published` (boolean — se aparece para alunos)

RLS: admins gerenciam; usuários autenticados leem só `published = true`.

### 2. Tela admin `/admin/updates`
- Listagem das versões anteriores
- Botão **"Nova atualização"** com 3 cards (Pequena / Média / Grande) que **calculam automaticamente** a próxima versão a partir da última registrada
- Campos: título + changelog
- Ao salvar: insere registro na tabela **e** atualiza `public/version.json` + `package.json` via script utilitário (descrito abaixo)

### 3. Fonte única da versão
- `public/version.json` continua sendo o ponto consultado pelo `UpdateBanner` em runtime
- `src/lib/app-version.ts` exporta a versão "build-time" para exibição em rodapés
- Migration inicial popula `platform_updates` com a versão atual (Beta 3.5.0)

### 4. Banner de atualização inteligente
Atualizar `UpdateBanner.tsx` para:
- Buscar a **última versão publicada** da tabela `platform_updates`
- Mostrar título + changelog dessa versão (não mais texto genérico)
- Marcar como visto por versão em `localStorage` (`sth_last_seen_version`) — não reaparece após o usuário fechar a mesma versão
- Reaparece apenas quando uma versão **maior** for publicada

### 5. Fluxo de uso (admin)
1. Admin entra em `/admin/updates`
2. Clica "Pequena / Média / Grande"
3. Sistema sugere automaticamente `3.5.1`, `3.6.0` ou `4.0.0`
4. Preenche título + changelog → Publicar
5. Registro salvo no banco; `version.json` atualizado; alunos veem o banner na próxima visita

## Detalhes Técnicos

**Migration:**
```sql
CREATE TABLE public.platform_updates (
  id uuid PK default gen_random_uuid(),
  version text NOT NULL UNIQUE,
  impact text NOT NULL CHECK (impact IN ('patch','minor','major')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT true,
  released_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
-- RLS: admins ALL; authenticated SELECT WHERE published
-- Seed inicial: ('3.5.0','minor','Lançamento Beta 3.5.0', '...')
```

**Helper `src/lib/version-bump.ts`:**
- `bumpVersion(current, impact)` retorna a próxima versão
- Usado na tela admin para sugerir o próximo número

**Atualização de `public/version.json`:**
- Edge function ou ação client-side via storage não fazem sentido aqui (arquivo estático). A abordagem realista: ao publicar uma update, gravamos a versão no banco **e** o `UpdateBanner` passa a consultar o banco como fonte da verdade (não mais o `version.json`). O `version.json` permanece para cache busting do service worker.

**Banner — chave de "visto":**
- `localStorage["sth_last_seen_version"] = "3.5.1"`
- Banner só renderiza se `lastDbVersion > lastSeenVersion` (comparação semver)

## Fora de escopo
- Push notification de atualização
- Rollback automático
- Versionamento por módulo (continua versão única da plataforma)

Posso seguir com a implementação completa?
