/**
 * GET  /api/admin/sequence-status   (público, sem auth)
 *   200 { enabled: boolean }
 *   Usado pelo aluno (e pelo pesquisador) pra saber se a sequência está
 *   habilitada. Polling do client cada ~10s pra detectar mudanças.
 *
 * POST /api/admin/sequence-status   (gateado por DEV_MODE_PASSWORD)
 *   Body: { devPassword: string, enabled: boolean }
 *   200 { enabled: boolean }
 *   401 { error: 'invalid_dev_password' }
 *   500 { error: 'misconfigured' }
 *
 * A flag fica armazenada em `app_settings` (key="sequence_enabled",
 * value="true"|"false"). Default = "true" (se a row não existe, considera
 * habilitada pra não trancar acesso por erro de migração).
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { assertSameOrigin, rateLimitLogin, clientIp } from '@/lib/origin';

const KEY = 'sequence_enabled';

/** Compare em tempo constante. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function GET() {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key: KEY } });
    // Default = true: se a row não existir (ex.: banco recém-migrado),
    // assume habilitado pra não bloquear acesso por falta de inicialização.
    const enabled = row ? row.value === 'true' : true;
    return NextResponse.json({ enabled });
  } catch (e) {
    console.error('[api/admin/sequence-status GET]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrf = assertSameOrigin(req);
    if (csrf) return csrf;

    const ip = clientIp(req);
    const rl = rateLimitLogin(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', retryAfterMs: rl.retryAfterMs },
        { status: 429 },
      );
    }

    let body: { devPassword?: unknown; enabled?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
    }
    const provided = typeof body.devPassword === 'string' ? body.devPassword : '';
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : null;
    if (enabled === null) {
      return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
    }

    const expected = process.env.DEV_MODE_PASSWORD ?? '';
    if (!expected) {
      console.error('[api/admin/sequence-status] DEV_MODE_PASSWORD ausente');
      return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
    }
    if (!safeEqual(provided, expected)) {
      return NextResponse.json({ error: 'invalid_dev_password' }, { status: 401 });
    }

    const value = enabled ? 'true' : 'false';
    await prisma.appSetting.upsert({
      where: { key: KEY },
      create: { key: KEY, value },
      update: { value },
    });
    return NextResponse.json({ enabled });
  } catch (e) {
    console.error('[api/admin/sequence-status POST]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
