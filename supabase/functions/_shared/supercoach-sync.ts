// Fire-and-forget helper to keep SuperCoach premium_expires_date in sync
// whenever the STH METHOD subscription changes (webhook, reconcile, manual PIX,
// admin edit). Non-blocking: any failure is logged but never breaks the caller.
export async function triggerSupercoachSync(params: {
  userId?: string;
  email?: string | null;
  name?: string | null;
  expiresDate: string; // YYYY-MM-DD
}): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) {
      console.warn('[supercoach-sync] missing SUPABASE_URL / SERVICE_ROLE_KEY');
      return;
    }
    if (!params.expiresDate || !/^\d{4}-\d{2}-\d{2}$/.test(params.expiresDate)) {
      console.warn('[supercoach-sync] invalid expiresDate', params.expiresDate);
      return;
    }

    // Resolve email/name from profile if only userId was given.
    let email = params.email || undefined;
    let name = params.name || undefined;
    if ((!email || !name) && params.userId) {
      try {
        const profRes = await fetch(
          `${url}/rest/v1/profiles?user_id=eq.${params.userId}&select=email,full_name`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
        );
        if (profRes.ok) {
          const rows = await profRes.json();
          const p = Array.isArray(rows) ? rows[0] : null;
          if (p) {
            email = email || p.email;
            name = name || p.full_name;
          }
        }
      } catch (e) {
        console.warn('[supercoach-sync] profile lookup failed', e);
      }
    }

    if (!email && !name) {
      console.warn('[supercoach-sync] no email/name to match student');
      return;
    }

    const res = await fetch(`${url}/functions/v1/supercoach-sync-expiration`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ action: 'update', email, name, expiresDate: params.expiresDate }),
    });
    const text = await res.text();
    console.log('[supercoach-sync] result', res.status, text.slice(0, 300));
  } catch (e) {
    console.error('[supercoach-sync] failed', e);
  }
}