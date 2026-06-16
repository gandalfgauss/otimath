/**
 * Configuração do iron-session — cookies httpOnly assinados.
 *
 * O cookie carrega APENAS { userId, username }. Senha nunca trafega de
 * volta. Como é httpOnly + sameSite=lax + secure (em prod), não pode
 * ser lido por document.cookie nem extraído pelo DevTools console.
 *
 * SESSION_PASSWORD precisa ter >= 32 chars (requisito do iron-session).
 */
import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  username?: string;
}

const sessionPassword = process.env.SESSION_PASSWORD;

if (!sessionPassword || sessionPassword.length < 32) {
  // Crasha cedo em prod se o secret não estiver setado/é fraco.
  // Em dev, deixa rodar com warning pra facilitar primeira execução
  // antes do .env.local estar pronto.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_PASSWORD env var ausente ou < 32 chars. Defina no Vercel antes do deploy.',
    );
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[session] SESSION_PASSWORD ausente/curta. Usando fallback DEV-ONLY. NÃO use em produção.',
  );
}

const SESSION_COOKIE_NAME = 'otimath-seq-session';

export const sessionOptions: SessionOptions = {
  password:
    sessionPassword && sessionPassword.length >= 32
      ? sessionPassword
      // Fallback só pra dev rodar sem .env — 32 chars fixos.
      : 'dev-only-fallback-not-for-prod-1234567890abcdef',
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // 30 dias — o aluno pode voltar dias depois e ainda ter sessão.
    maxAge: 60 * 60 * 24 * 30,
  },
};

/** Lê a sessão do request atual (Next App Router). */
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
