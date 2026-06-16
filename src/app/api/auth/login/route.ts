/**
 * POST /api/auth/login
 *
 * Body: { username: string, password: string }
 *
 * Resposta:
 *   200 { ok: true, hasActiveRun: boolean, username: string }
 *   400 { error: 'bad_payload' }
 *   401 { error: 'invalid_credentials' }
 *   429 { error: 'rate_limited', retryAfterMs }
 *   500 { error: 'internal' }
 *
 * Cria session cookie httpOnly. NÃO retorna password_hash nem userId
 * pro cliente.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { verifyPassword } from '@/lib/passwords';
import { assertSameOrigin, rateLimitLogin, clientIp } from '@/lib/origin';

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

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    // Faz o compare mesmo se o user não existe — evita timing attack que
    // diferenciaria "user inexistente" de "senha errada".
    const dummyHash = '$2b$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrs';
    const ok = await verifyPassword(password, user?.passwordHash ?? dummyHash);
    if (!user || !ok) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    await session.save();

    // Já checa se existe run ativa pra o client decidir se vai hidratar.
    const activeRun = await prisma.sequenceRun.findFirst({
      where: { userId: user.id, endedAt: null },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      hasActiveRun: !!activeRun,
      username: user.username,
    });
  } catch (e) {
    console.error('[api/auth/login]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
