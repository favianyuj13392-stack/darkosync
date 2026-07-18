interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  WHATSAPP_NUMBER?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const NEEDS = new Set(['backend', 'ai', 'ecommerce', 'optimization', 'not_sure']);
const STAGES = new Set(['idea', 'existing', 'migration', 'critical']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: object, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const bounded = (value: unknown, min: number, max: number) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Origin not allowed.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'JSON required.' }, 415);
  }
  const supabaseUrl = env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const whatsapp = env.WHATSAPP_NUMBER;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey || !turnstileSecret || whatsapp !== '59163125963') {
    return json({ error: 'Service unavailable.' }, 503);
  }
  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > 32_768) return json({ error: 'Payload too large.' }, 413);
  let body: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Invalid submission.' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32_768) {
        await reader.cancel().catch(() => undefined);
        return json({ error: 'Payload too large.' }, 413);
      }
      chunks.push(value);
    }
    const raw = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength; }
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }
  if (!body || Array.isArray(body)) return json({ error: 'Invalid submission.' }, 400);
  const valid =
    body.website === '' && body.consent === true && typeof body.request_id === 'string' && UUID.test(body.request_id) &&
    bounded(body.turnstile_token, 1, 2048) &&
    bounded(body.name, 2, 120) && bounded(body.email, 5, 254) && bounded(body.company, 2, 160) &&
    bounded(body.phone, 7, 32) && bounded(body.bottleneck, 10, 4000) &&
    typeof body.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) &&
    typeof body.need === 'string' && NEEDS.has(body.need) && typeof body.stage === 'string' && STAGES.has(body.stage);
  if (!valid) return json({ error: 'Invalid submission.' }, 400);

  const challenge = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: turnstileSecret, response: body.turnstile_token as string,
      remoteip: request.headers.get('CF-Connecting-IP') ?? '' }),
    signal: AbortSignal.timeout(5_000),
  }).catch(() => null);
  const challengeResult = await challenge?.json().catch(() => null) as { success?: boolean } | null;
  if (!challengeResult?.success) return json({ error: 'Human verification failed.' }, challenge ? 403 : 503);
  const clean = (key: string) => (body[key] as string).trim();
  const lead = {
    request_id: body.request_id,
    name: clean('name'), email: clean('email'), company: clean('company'), phone: clean('phone'),
    need: body.need, project_stage: body.stage, bottleneck: clean('bottleneck'),
    consent_granted: true, consented_at: new Date().toISOString(),
  };
  const saved = await fetch(`${supabaseUrl}/rest/v1/leads?on_conflict=request_id`, {
    method: 'POST',
    headers: {
      apikey: serviceKey, authorization: `Bearer ${serviceKey}`, 'content-type': 'application/json',
      prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  if (!saved?.ok) return json({ error: 'Could not save your request. Please retry.' }, 502);
  const message = `*SOLICITUD DE DIAGNÓSTICO - DARKOSYNC*\n\n• *Nombre:* ${lead.name}\n• *Empresa:* ${lead.company}\n• *WhatsApp:* ${lead.phone}\n• *Email:* ${lead.email}\n\n• *Necesidad:* ${lead.need}\n• *Etapa:* ${lead.project_stage}\n• *Cuello de botella:* ${lead.bottleneck}`;
  return json({ whatsapp_url: `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` });
};