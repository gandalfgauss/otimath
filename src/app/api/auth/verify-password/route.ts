/**
 * POST /api/auth/verify-password
 *
 * Endpoint genérico pra validar senhas de gating server-side. Substitui
 * o padrão antigo de hardcoded `"@dev@" === input` no client (que vazava
 * no bundle) por checagem contra env var.
 *
 * Body: { kind: 'questionnaire' | 'devmode', password: string }
 *
 * Resposta:
 *   200 { ok: true }            — senha correta
 *   401 { error: 'invalid' }    — senha errada (NÃO diferencia "vazia" de "errada")
 *   400 { error: 'bad_payload' }
 *   429 { error: 'rate_limited', retryAfterMs }
 *   500 { error: 'misconfigured' }  — env var ausente no servidor
 *
 * NÃO retorna a senha esperada de volta, NÃO inclui no bundle do
 * client. Usa compare em tempo constante pra evitar timing attacks.
 *
 * Mesmo padrão de rate limit do /api/auth/login pra não permitir
 * brute-force das senhas curtas que esses gates usam.
 */
import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, rateLimitLogin, clientIp } from '@/lib/origin';

type Kind = 'questionnaire' | 'devmode';

function getExpected(kind: Kind): string | null {
  if (kind === 'questionnaire') return process.env.QUESTIONNAIRE_PASSWORD ?? null;
  if (kind === 'devmode') return process.env.DEV_MODE_PASSWORD ?? null;
  return null;
}

/** Compare em tempo constante; tamanhos diferentes -> false imediato.
 *  Sem isso, um adversário poderia inferir o tamanho da senha pelo
 *  tempo de resposta (curtinha demais pra importar muito aqui, mas
 *  hábito é bom). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
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

  let body: { kind?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }
  const kind = body.kind === 'questionnaire' || body.kind === 'devmode' ? body.kind : null;
  const password = typeof body.password === 'string' ? body.password.trim() : '';
  if (!kind || !password) {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }

  const expected = getExpected(kind);
  if (!expected) {
    console.error(`[api/auth/verify-password] env ausente para kind="${kind}"`);
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  if (!safeEqual(password, expected)) {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
