import { StatusBar, Style } from "@capacitor/status-bar";

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
};