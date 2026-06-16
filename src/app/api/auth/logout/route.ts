/**
 * POST /api/auth/logout
 *
 * Body: { masterPassword: string }
 *
 * Resposta:
 *   200 { ok: true }
 *   401 { error: 'invalid_master_password' }
 *   403 (origin)
 *   500
 *
 * Diferente de uma "saída" silenciosa: este endpoint ENCERRA a run
 * ativa do aluno (ended_reason='logout') ANTES de limpar o cookie.
 * Próximo login do mesmo aluno começa do zero (nova run).
 *
 * A senha mestra vem do env LOGOUT_MASTER_PASSWORD — só o professor
 * sabe. Aluno tentando deslogar via este modal sem essa senha falha.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertSameOrigin } from '@/lib/origin';

export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  let body: { masterPassword?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
  }
  const provided = typeof body.masterPassword === 'string' ? body.masterPassword : '';
  const expected = process.env.LOGOUT_MASTER_PASSWORD ?? '';
  if (!expected) {
    console.error('[api/auth/logout] LOGOUT_MASTER_PASSWORD env não setada.');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  // Comparação em tempo constante simples (provided pode ter qualquer tamanho).
  if (provided.length !== expected.length) {
    return NextResponse.json({ error: 'invalid_master_password' }, { status: 401 });
  }
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json({ error: 'invalid_master_password' }, { status: 401 });
  }

  try {
    const session = await getSession();
    if (session.userId) {
      // Encerra a run ativa do aluno (se houver).
      await prisma.sequenceRun.updateMany({
        where: { userId: session.userId, endedAt: null },
        data: { endedAt: new Date(), endedReason: 'logout' },
      });
    }
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/auth/logout]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
