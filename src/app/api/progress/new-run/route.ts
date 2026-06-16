/**
 * POST /api/progress/new-run
 *
 * Usado pelo botão "Voltar para o início" na tela de conclusão.
 * NÃO apaga dados antigos. Apenas:
 *   1) marca a run ativa atual como ended_reason='completed'
 *   2) cria uma run nova (zerada)
 *
 * Cada conclusão gera uma linha permanente na tabela sequence_runs.
 *
 * Resposta:
 *   200 { ok: true, runId }  — id da nova run
 *   401 — sem sessão
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertSameOrigin } from '@/lib/origin';

export async function POST(req: NextRequest) {
  const csrf = assertSameOrigin(req);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  try {
    // Encerra a run ativa (se existir). Não apaga.
    await prisma.sequenceRun.updateMany({
      where: { userId: session.userId, endedAt: null },
      data: { endedAt: new Date(), endedReason: 'completed' },
    });
    // Cria nova run zerada.
    const created = await prisma.sequenceRun.create({
      data: {
        userId: session.userId,
        telemetryJson: {},
        elapsedTotalMs: 0,
        elapsedRouletteMs: 0,
        elapsedTwoDicesMs: 0,
        currentStage: 'intro',
        currentOvaPhase: null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, runId: created.id });
  } catch (e) {
    console.error('[api/progress/new-run]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
