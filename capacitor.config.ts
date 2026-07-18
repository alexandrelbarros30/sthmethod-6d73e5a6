import type { CapacitorConfig } from '@capacitor/cli';

// Perfil de produção: para gerar APK/AAB pronto para dispositivo ou Play Store,
// o app precisa rodar com os arquivos empacotados em `dist/` (via `npm run build`
// + `npx cap sync`). Deixe a variável CAP_ENV=production no ambiente do build
// (o workflow do GitHub Actions já faz isso) para desativar o hot-reload do
// preview do Lovable. Em desenvolvimento local, sem a variável, o app abre
// direto do preview para hot-reload no celular/emulador.
const isProduction = process.env.CAP_ENV === 'production';

const config: CapacitorConfig = {
  appId: 'app.lovable.b584eea6c8424d9386ab554e2c58d9fb',
  appName: 'sthconsultoria',
  webDir: 'dist',
  android: {
    // Permite carregar imagens/recursos http legados dentro do WebView
    // (algumas thumbs de treino ainda podem vir sem https)
    allowMixedContent: true,
  },
  // Deixa o app rodar edge-to-edge (fullscreen) para não competir com a barra
  // de status/notificações do celular. A StatusBar continua transparente por
  // cima do conteúdo do app.
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#00000000',
    },
  },
  ...(isProduction
    ? {}
    : {
        server: {
          url: 'https://b584eea6-c842-4d93-86ab-554e2c58d9fb.lovableproject.com?forceHideBadge=true',
          cleartext: true,
        },
      }),
};

export default config;
