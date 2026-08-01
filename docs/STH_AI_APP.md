# STH AI — App (Android, iOS e Web App)

O STH AI é um app **separado** do STH METHOD, com identidade, ícone e appId próprios,
mas usando o mesmo código e o mesmo backend.

| | STH METHOD | STH AI |
|---|---|---|
| appId | `com.sthmethod.app` | `com.sthmethod.ai` |
| Nome | STH METHOD | STH AI |
| Rota inicial no app | `/login` | `/ai/app` |
| Manifesto PWA | `/manifest.webmanifest` | `/manifest-ai.webmanifest` |
| Ícones | `pwa-icon-*.png` | `pwa-ai-*.png` |

## 1. Web App (PWA) — já ativo
Em qualquer rota `/ai`, o app troca manifesto, tema, título e ícone para o STH AI
(`src/hooks/useAiManifest.tsx`, aplicado por `useSthAiTheme`).

- **Android/Chrome:** abrir `https://sthmethod.com/ai` → menu → *Instalar app*.
- **iPhone/Safari:** abrir `https://sthmethod.com/ai` → Compartilhar → *Adicionar à Tela de Início*.

O atalho abre em `/ai/app` em tela cheia, sem barra do navegador.

## 2. Android (APK / AAB)
Build automático pelo workflow **STH AI — Android Build** (`.github/workflows/ai-android-build.yml`),
disparado manualmente em *Actions → Run workflow*. Ele usa `APP_TARGET=ai` e `VITE_APP_TARGET=ai`.

Artefatos: `sthai-debug-apk`, `sthai-release-apk`, `sthai-release-aab` e o release `ai-latest` com `sthai.apk`.

Assinatura de release usa os mesmos secrets: `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

### Local
```bash
export APP_TARGET=ai VITE_APP_TARGET=ai CAP_ENV=production
npm run build
npx cap add android      # se ainda não existir
npx cap sync android
npx cap run android
```

## 3. iOS (requer Mac + Xcode)
```bash
export APP_TARGET=ai VITE_APP_TARGET=ai CAP_ENV=production
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```
No Xcode: selecionar o time de desenvolvimento, confirmar o Bundle Identifier `com.sthmethod.ai`,
gerar o ícone a partir de `public/pwa-ai-1024.png` e enviar via *Product → Archive* para o App Store Connect.

> Importante: os diretórios `android/` e `ios/` são gerados por alvo. Para alternar entre
> STH METHOD e STH AI localmente, apague/recrie a pasta nativa ou mantenha clones separados
> do repositório, já que o appId muda conforme `APP_TARGET`.
