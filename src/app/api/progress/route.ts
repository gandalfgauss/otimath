/**
 * GET  /api/progress  — hidrata: retorna a run ativa do usuário.
 *   200 {
 *     runId, startedAt, lastUpdatedAt,
 *     telemetryJson,
 *     elapsedTotalMs, elapsedRouletteMs, elapsedTwoDicesMs,
 *     currentStage, currentOvaPhase
 *   }
 *   200 { runId: null }  — sem run ativa (vai começar do zero)
 *   401 — sem sessão
 *
 * POST /api/progress — salva snapshot. Cria a run ativa se ainda não existir.
 *   Body: {
 *     telemetryJson, elapsedTotalMs, elapsedRouletteMs, elapsedTwoDicesMs,
 *     currentStage, currentOvaPhase
 *   }
 *   200 { ok: true, runId }
 *
 * Aceita Content-Type `application/json` ou `text/plain` (pra suportar
 * navigator.sendBeacon que só envia text/plain).
 *
 * Telemetria de DEV mode NÃO deve chegar aqui — o frontend gateia.
 * Mesmo assim, este endpoint não tem como saber, então confia no client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertSameOrigin } from '@/lib/origin';
import { Prisma } from '@prisma/client';

interface ProgressPayload {
  telemetryJson?: unknown;
  elapsedTotalMs?: number;
  elapsedRouletteMs?: number;
  elapsedTwoDicesMs?: number;
  currentStage?: string;
  currentOvaPhase?: string | null;
  ovaSnapshot?: unknown; // { ova, snapshot } ou null
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  try {
    const run = await prisma.sequenceRun.findFirst({
      where: { userId: session.userId, endedAt: null },
      orderBy: { startedAt: 'desc' },
    });
    if (!run) return NextResponse.json({ runId: null });
    return NextResponse.json({
      runId: run.id,
      startedAt: run.startedAt,
      lastUpdatedAt: run.lastUpdatedAt,
      telemetryJson: run.telemetryJson,
      elapsedTotalMs: run.elapsedTotalMs,
      elapsedRouletteMs: run.elapsedRouletteMs,
      elapsedTwoDicesMs: run.elapsedTwoDicesMs,
      currentStage: run.currentStage,
      currentOvaPhase: run.currentOvaPhase,
      ovaSnapshot: run.ovaSnapshot,
    });
  } catch (e) {
    console.error('[api/progress GET]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Try externo gigante: pega QUALQUER erro (Prisma, session, parse,
  // assertSameOrigin, etc.) e devolve detalhado em DEV.
  try {
    // sendBeacon manda text/plain — não vai bater o Origin header strict
    // em alguns browsers. Mantemos a checagem porque navegadores modernos
    // populam o Origin mesmo em sendBeacon.
    const csrf = assertSameOrigin(req);
    if (csrf) return csrf;

    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    // Aceita text/plain (sendBeacon) e application/json.
    let raw: string;
    try {
      raw = await req.text();
    } catch {
      return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
    }
    let body: ProgressPayload;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'bad_payload' }, { status: 400 });
    }

    const data: Prisma.SequenceRunUncheckedUpdateInput = {};
    if (body.telemetryJson !== undefined) {
      data.telemetryJson = body.telemetryJson as Prisma.InputJsonValue;
    }
    if (typeof body.elapsedTotalMs === 'number') data.elapsedTotalMs = body.elapsedTotalMs;
    if (typeof body.elapsedRouletteMs === 'number') data.elapsedRouletteMs = body.elapsedRouletteMs;
    if (typeof body.elapsedTwoDicesMs === 'number') data.elapsedTwoDicesMs = body.elapsedTwoDicesMs;
    if (typeof body.currentStage === 'string') data.currentStage = body.currentStage;
    if (body.currentOvaPhase === null || typeof body.currentOvaPhase === 'string') {
      data.currentOvaPhase = body.currentOvaPhase;
    }
    if ('ovaSnapshot' in body) {
      data.ovaSnapshot = body.ovaSnapshot === null
        ? Prisma.DbNull
        : (body.ovaSnapshot as Prisma.InputJsonValue);
    }

    // Procura run ativa; se não houver, cria.
    const existing = await prisma.sequenceRun.findFirst({
      where: { userId: session.userId, endedAt: null },
      select: { id: true },
    });
    if (existing) {
      await prisma.sequenceRun.update({
        where: { id: existing.id },
        data,
      });
      return NextResponse.json({ ok: true, runId: existing.id });
    }
    const created = await prisma.sequenceRun.create({
      data: {
        userId: session.userId,
        telemetryJson: (body.telemetryJson ?? {}) as Prisma.InputJsonValue,
        elapsedTotalMs: typeof body.elapsedTotalMs === 'number' ? body.elapsedTotalMs : 0,
        elapsedRouletteMs:
          typeof body.elapsedRouletteMs === 'number' ? body.elapsedRouletteMs : 0,
        elapsedTwoDicesMs:
          typeof body.elapsedTwoDicesMs === 'number' ? body.elapsedTwoDicesMs : 0,
        currentStage:
          typeof body.currentStage === 'string' ? body.currentStage : 'intro',
        currentOvaPhase:
          typeof body.currentOvaPhase === 'string' ? body.currentOvaPhase : null,
        ovaSnapshot:
          body.ovaSnapshot !== undefined && body.ovaSnapshot !== null
            ? (body.ovaSnapshot as Prisma.InputJsonValue)
            : Prisma.DbNull,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, runId: created.id });
  } catch (e) {
    console.error('[api/progress POST]', e);
    // Em DEV, devolve o erro REAL pro client conseguir diagnosticar pelo
    // DevTools. Em prod, mantém opaco pra não vazar internals.
    const isDev = process.env.NODE_ENV !== 'production';
    const payload: Record<string, unknown> = { error: 'internal' };
    if (isDev && e instanceof Error) {
      payload.message = e.message;
      payload.name = e.name;
      payload.stack = e.stack?.split('\n').slice(0, 5).join('\n');
      // Prisma errors trazem `.code` e `.meta` úteis.
      const maybePrismaErr = e as { code?: unknown; meta?: unknown };
      if (typeof maybePrismaErr.code === 'string') payload.code = maybePrismaErr.code;
      if (maybePrismaErr.meta !== undefined) payload.meta = maybePrismaErr.meta;
    }
    return NextResponse.json(payload, { status: 500 });
  }
}
