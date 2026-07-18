import { StatusBar, Style } from "@capacitor/status-bar";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";

const isNativeApp = () => {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return !!w.Capacitor?.isNativePlatform?.();
};

/**
 * Ativa modo edge-to-edge no app nativo: StatusBar transparente sobreposta
 * ao WebView, permitindo que o app ocupe a tela inteira sem competir com a
 * área de notificações. Silencioso fora do Capacitor.
 */
export const enableNativeFullscreen = async () => {
  if (!isNativeApp()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#00000000" });
  } catch (_) {
    // Plugin ausente em preview web — ignorar
  }
  try {
    // Torna a barra de navegação do Android transparente e ativa modo
    // edge-to-edge de verdade. Sem isso, no Android 10+ o app fica com uma
    // faixa preta ou branca embaixo competindo com a navegação nativa.
    await EdgeToEdge.enable();
    await EdgeToEdge.setBackgroundColor({ color: "#00000000" });
  } catch (_) {
    // Plugin ausente / iOS — ignorar
  }
};