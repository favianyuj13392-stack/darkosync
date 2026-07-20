interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  WHATSAPP_NUMBER?: string;
  TURNSTILE_SECRET_KEY?: string;
}

const NEEDS = new Set(['backend', 'ai', 'ecommerce', 'optimization', 'not_sure']);
const STAGES = new Set(['idea', 'existing', 'migration', 'critical']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CSP_REPORT_ONLY = "default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'";
const SECURITY_HEADERS: Record<string, string> = {
  'cache-control': 'no-store',
  'content-security-policy-report-only': CSP_REPORT_ONLY,
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};
const json = (body: object, status = 200, extraHeaders?: HeadersInit) => {
  const headers = new Headers({ ...SECURITY_HEADERS, 'content-type': 'application/json; charset=utf-8' });
  new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  return new Response(JSON.stringify(body), { status, headers });
};
const bounded = (value: unknown, min: number, max: number) =>
  typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;

type Context = { request: Request; env: Env };

const handlePost = async ({ request, env }: Context) => {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Origin not allowed.' }, 403);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return json({ error: 'JSON required.' }, 415);
  }
  const supabaseUrl = env.SUPABASE_URL?.replace(/\/+$/, '');
  const secretKey = env.SUPABASE_SECRET_KEY;
  const whatsapp = env.WHATSAPP_NUMBER;
  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!supabaseUrl || !secretKey || !turnstileSecret || whatsapp !== '59163125963') {
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
  if (!challenge?.ok) return json({ error: 'Human verification unavailable.' }, 503);
  const challengeResult = await challenge.json().catch(() => null) as {
    success?: boolean; action?: string; hostname?: string;
  } | null;
  const expectedHostname = new URL(request.url).hostname;
  if (challengeResult?.success !== true || challengeResult.action !== 'lead_submit' ||
      challengeResult.hostname !== expectedHostname) {
    return json({ error: 'Human verification failed.' }, 403);
  }
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
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      'content-type': 'application/json',
      prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(8_000),
  }).catch(() => null);
  if (!saved?.ok) {
    const upstreamStatus = saved?.status ?? 0;
    const code = upstreamStatus === 0 ? 'LEAD_STORE_UNREACHABLE'
      : upstreamStatus === 401 || upstreamStatus === 403 ? 'LEAD_STORE_AUTH'
      : upstreamStatus === 404 ? 'LEAD_STORE_SCHEMA'
      : upstreamStatus === 409 ? 'LEAD_STORE_CONFLICT'
      : upstreamStatus === 400 || upstreamStatus === 422 ? 'LEAD_STORE_REJECTED'
      : upstreamStatus >= 500 ? 'LEAD_STORE_UPSTREAM'
      : 'LEAD_STORE_UNKNOWN';
    console.error(JSON.stringify({
      event: 'lead_persistence_failed',
      reference: body.request_id,
      upstream_status: upstreamStatus,
      code,
    }));
    return json({ error: 'Could not save your request. Please retry.', code, reference: body.request_id }, 502);
  }
  const message = `*SOLICITUD DE DIAGNÓSTICO - DARKOSYNC*\n\n• *Nombre:* ${lead.name}\n• *Empresa:* ${lead.company}\n• *WhatsApp:* ${lead.phone}\n• *Email:* ${lead.email}\n\n• *Necesidad:* ${lead.need}\n• *Etapa:* ${lead.project_stage}\n• *Cuello de botella:* ${lead.bottleneck}`;
  return json({ whatsapp_url: `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` });
};

export const onRequest = (context: Context) => context.request.method === 'POST'
  ? handlePost(context)
  : json({ error: 'Method not allowed.' }, 405, { allow: 'POST' });