/**
 * POST /api/progress/finish-and-logout
 *
 * Usado pelo botão "Voltar para o início" na tela de conclusão.
 *
 * COMPORTAMENTO
 *   1) Marca a run ativa como ended_reason='completed' (preserva os dados).
 *   2) Destrói a sessão (logout) — derruba o cookie.
 *
 * NÃO CRIA NOVA RUN AQUI. O próximo login (do mesmo aluno ou de outro)
 * vai criar uma run nova zerada via /api/auth/login. Isso garante que
 * o banco fica com APENAS a entrada antiga + qualquer entrada nova
 * criada SÓ depois do próximo login real — evita ter uma linha
 * "fantasma" no banco esperando alguém logar.
 *
 * Diferente de /api/auth/logout: este NÃO exige LOGOUT_MASTER_PASSWORD
 * (é a auto-saída do aluno após terminar a sequência, não a saída
 * forçada pelo professor).
 *
 * Resposta:
 *   200 { ok: true }
 *   401 — sem sessão
 *   500 — erro interno
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
    // Encerra a run ativa (se existir). Preserva os dados.
    await prisma.sequenceRun.updateMany({
      where: { userId: session.userId, endedAt: null },
      data: { endedAt: new Date(), endedReason: 'completed' },
    });
    // Destrói sessão (limpa cookie).
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/progress/finish-and-logout]', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
