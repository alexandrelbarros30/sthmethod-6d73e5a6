/**
 * Notificações locais do STH AI (treino e refeições).
 * Usa o service worker quando disponível (melhor entrega no Android/PWA)
 * e cai para a Notification API em navegadores comuns.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export async function showLocalNotification(
  title: string,
  options: NotificationOptions & { url?: string } = {},
): Promise<void> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const { url, ...rest } = options;
    const payload: NotificationOptions = {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...rest,
      data: { url: url ?? "/ai/app", ...(rest.data ?? {}) },
    };
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (reg) {
        await reg.showNotification(title, payload);
        return;
      }
    }
    new Notification(title, payload);
  } catch {
    /* ambiente sem suporte a notificações */
  }
}
