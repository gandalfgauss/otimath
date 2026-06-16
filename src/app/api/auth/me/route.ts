/**
 * GET /api/auth/me
 * Retorna { username, hasActiveRun } se sessão válida; 401 caso contrário.
 * Usado pelo frontend ao montar — se 401, mostra tela de login.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.username) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  try {
    const activeRun = await prisma.sequenceRun.findFirst({
      where: { userId: session.userId, endedAt: null },
      select: { id: true },
    });
    return NextResponse.json({
      username: session.username,
      hasActiveRun: !!activeRun,
    });
  } catch (e) {
    console.error('[api/auth/me]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
