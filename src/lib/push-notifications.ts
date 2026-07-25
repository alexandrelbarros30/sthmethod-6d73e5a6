import { supabase } from "@/integrations/supabase/client";

// Chave pública VAPID — segura para expor no cliente.
export const VAPID_PUBLIC_KEY =
  "BM5KA40nSmWGgn5Fu4HP7xFb7Q-j8cAhcajA0suHP--Kbq-79-eEIvQ4n7g-tWtyO5B-FUQ2yV1WfnzGdh5rx0w";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

/** Solicita permissão, cria assinatura e persiste no Supabase. */
export async function subscribeCurrentUser(userId: string): Promise<PushSubscription> {
  if (!isPushSupported()) throw new Error("Push notifications não suportadas neste dispositivo.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permissão de notificação negada.");

  const reg = await getRegistration();
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });
  }

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  const p256dh =
    json.keys?.p256dh ?? arrayBufferToBase64(sub.getKey("p256dh"));
  const auth = json.keys?.auth ?? arrayBufferToBase64(sub.getKey("auth"));

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh,
      auth,
      user_agent: navigator.userAgent,
      enabled: true,
      failure_count: 0,
    },
    { onConflict: "user_id,endpoint" },
  );
  if (error) throw error;
  return sub;
}

/** Cancela a assinatura no navegador e desativa no Supabase. */
export async function unsubscribeCurrentUser(userId: string): Promise<void> {
  const sub = await getCurrentSubscription();
  if (sub) {
    try {
      await supabase
        .from("push_subscriptions")
        .update({ enabled: false })
        .eq("user_id", userId)
        .eq("endpoint", sub.endpoint);
    } catch (_) {}
    try { await sub.unsubscribe(); } catch (_) {}
  }
}