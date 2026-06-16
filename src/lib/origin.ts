/**
 * Verificação anti-CSRF simples por header `Origin`.
 *
 * Combinado com cookies sameSite=lax (já configurado em session.ts),
 * isso bloqueia POSTs cross-site sem precisar de tokens CSRF separados.
 * Vale só pra mutações (POST/PUT/DELETE); GETs com session cookie já
 * estão protegidos pelo sameSite.
 */
import { NextRequest, NextResponse } from 'next/server';

export function assertSameOrigin(req: NextRequest): NextResponse | null {
  // Em dev (`next dev`), o Origin pode vir como http://localhost:3000 e o
  // Host como localhost:3000 — comparação direta vale. Em prod, ambos
  // batem o domínio do Vercel.
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin) {
    // Requisições same-origin do mesmo Next normalmente trazem origin.
    // Sua ausência é suspeita — bloqueia.
    return NextResponse.json(
      { error: 'origin_missing' },
      { status: 403 },
    );
  }
  try {
    const url = new URL(origin);
    if (url.host !== host) {
      return NextResponse.json(
        { error: 'origin_mismatch' },
        { status: 403 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'origin_invalid' },
      { status: 403 },
    );
  }
  return null;
}

/** Rate limit MUITO simples em memória por IP — janela rolante de 60s. */
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 60_000;

export function rateLimitLogin(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }
  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: rec.resetAt - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function clientIp(req: NextRequest): string {
  // x-forwarded-for chega populado no Vercel. Fallback p/ dev local.
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
