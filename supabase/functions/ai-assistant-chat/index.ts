import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

// DESATIVADO — substituído pelo serviço único `sth-automation-engine`.
// Mantido como stub apenas para chamadas legadas não quebrarem.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      ok: false,
      deprecated: true,
      message: 'Função desativada. Toda a automação agora roda em sth-automation-engine.',
    }),
    { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
