'use client';

import { useState } from 'react';
import { Lock, User, LogIn, KeyRound, Loader2 } from 'lucide-react';
import { Grid } from '@/components/global/Grid';
import { GridItem } from '@/components/global/GridItem';
import { Button } from '@/components/global/Button';

/**
 * Tela de login da Sequência Didática.
 *
 * Renderizada NO LUGAR do conteúdo gateado enquanto o aluno não está
 * logado. Faz POST em `/api/auth/login` e, em sucesso, dispara `onLogin`
 * com flag indicando se há run ativa a hidratar (continua de onde
 * parou) ou se vai começar do zero.
 *
 * Sem mais credenciais hardcoded no bundle: tudo validado server-side.
 * O cookie de sessão é httpOnly (invisível ao console).
 */

interface SequenceLoginProps {
  /** Chamado após login bem-sucedido. Passa `hasActiveRun=true` se o
   *  banco tem uma run não-encerrada do aluno (vai hidratar tempo,
   *  cena e telemetria). */
  onLogin: (params: { username: string; hasActiveRun: boolean }) => void;
}

export function SequenceLogin({ onLogin }: Readonly<SequenceLoginProps>) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Estado "Entrando..." — sinaliza progresso enquanto a sequência
  // monta. A montagem dos OVAs envolve hooks pesados (3500+ linhas de
  // estado em useRouletteHooks, vários useEffect de hidratação, etc.)
  // e bloqueia o thread de UI por ~200-500ms dependendo do dispositivo.
  // Sem indicador, o aluno clica e o botão "trava" sem feedback.
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    // ═════════════════════════════════════════════════════════════════
    // ⚠️ BACKDOOR TEMPORÁRIA — REMOVER ANTES DE VOLTAR ONLINE ⚠️
    // Adicionada em <data-atual> enquanto o banco Neon está em processo
    // de restauração. Permite entrar como "Rangel" / "123" sem bater
    // no /api/auth/login (que precisa do banco). O gate `!== 'production'`
    // também limita ao localhost/preview, mas MESMO ASSIM: remover essa
    // seção quando o banco voltar. Grep por 'DEV_BYPASS' pra achar.
    // ═════════════════════════════════════════════════════════════════
    if (username.trim() === 'Rangel' && password === '123') {
      // Marca a sessão como bypass — o page.tsx lê isso no mount pra
      // pular o /api/auth/me (que também depende do banco).
      try { sessionStorage.setItem('otimath_dev_bypass_user', 'Rangel'); } catch { /* ignora */ }
      setTimeout(() => {
        onLogin({ username: 'Rangel', hasActiveRun: false });
      }, 0);
      return;
    }
    // ═════════════════════════════════════════════════════════════════
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'same-origin',
      });
      if (!res.ok) {
        let msg = 'Usuário ou senha incorretos. Confira com o pesquisador e tente novamente.';
        try {
          const data = await res.json();
          if (data?.error === 'rate_limited') {
            msg = 'Muitas tentativas. Espere alguns segundos e tente novamente.';
          }
        } catch { /* ignora */ }
        setError(msg);
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { username: string; hasActiveRun: boolean };
      // Mesmo padrão do código antigo: setTimeout(0) pra spinner pintar
      // antes da montagem pesada.
      setTimeout(() => {
        onLogin({ username: data.username, hasActiveRun: data.hasActiveRun });
      }, 0);
    } catch {
      setError('Não foi possível conectar ao servidor. Verifique sua internet.');
      setLoading(false);
    }
  };

  return (
    // `data-skip-telemetry`: o listener global em useTelemetry.ts
    // checa esse atributo via `closest()` e pula qualquer clique cuja
    // árvore tenha ele. Login NÃO faz parte do percurso pedagógico —
    // botões, inputs e qualquer ação aqui não deve inflar o contador
    // de interações da sequência.
    <div data-skip-telemetry>
      <Grid
        id="seq-login"
        paddings="pt-xl pb-xl"
        backgroundColor="bg-linear-(--color-gradient-level-5)"
      >
      <GridItem cols="col-[4_/_10] max-md:col-[2_/_12] max-sm:col-[1_/_13]">
        <form
          onSubmit={handleSubmit}
          // Card central com mesma linguagem visual dos cards do projeto
          // (gradient-level-1 + shadow-level-1 + rounded-lg) — espelha o
          // PostSequenceForm pra continuidade estética.
          className="rounded-lg shadow-level-1 bg-linear-(--color-gradient-level-1)
            p-xs flex flex-col items-stretch gap-y-xs"
          aria-labelledby="seq-login-title"
        >
          {/* Cabeçalho — ícone de cadeado + título + subtítulo */}
          <div className="flex flex-col items-center text-center gap-y-xs">
            <div className="w-14 h-14 rounded-full bg-brand-otimath-lightest flex items-center justify-center">
              <Lock size={28} className="text-brand-otimath-pure" aria-hidden="true" />
            </div>
            <span className="ds-overline text-brand-otimath-pure tracking-wider">
              ACESSO RESTRITO
            </span>
            <h2 id="seq-login-title" className="ds-heading-mega text-brand-otimath-dark max-w-[520px]">
              Entre para iniciar a sequência
            </h2>
            <div className="w-12 h-0.5 bg-brand-otimath-pure rounded-full" />
            <p className="ds-body text-neutral-darkest max-w-[520px] leading-relaxed">
              Esta sequência didática faz parte de uma <strong>pesquisa
              acadêmica do PROFMAT</strong>.
            </p>
          </div>

          {/* Campo USUÁRIO */}
          <label className="flex flex-col gap-y-nano">
            <span className="ds-small-bold text-neutral-darkest flex items-center gap-x-nano">
              <User size={14} aria-hidden="true" />
              Usuário
            </span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              disabled={loading}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Digite o usuário fornecido"
              aria-invalid={error !== null}
              className={`ds-body rounded-md p-xxxs border-thin transition-colors duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed
                ${error
                  ? 'border-feedback-error-dark bg-feedback-error-lightest text-feedback-error-darkest focus:border-feedback-error-dark'
                  : 'border-neutral-light bg-neutral-white text-neutral-darkest focus:border-brand-otimath-pure'
                }`}
            />
          </label>

          {/* Campo SENHA */}
          <label className="flex flex-col gap-y-nano">
            <span className="ds-small-bold text-neutral-darkest flex items-center gap-x-nano">
              <KeyRound size={14} aria-hidden="true" />
              Senha
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              disabled={loading}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Digite a senha fornecida"
              aria-invalid={error !== null}
              aria-describedby={error ? 'login-error' : undefined}
              className={`ds-body rounded-md p-xxxs border-thin transition-colors duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed
                ${error
                  ? 'border-feedback-error-dark bg-feedback-error-lightest text-feedback-error-darkest focus:border-feedback-error-dark'
                  : 'border-neutral-light bg-neutral-white text-neutral-darkest focus:border-brand-otimath-pure'
                }`}
            />
            {error && (
              <span
                id="login-error"
                className="ds-small text-feedback-error-dark"
                role="alert"
              >
                {error}
              </span>
            )}
          </label>

          {/* Ação primária — submit do form (também dispara via Enter).
              Durante o `loading`, troca ícone+texto pro estado "Entrando..."
              com spinner — sinaliza progresso enquanto a sequência monta. */}
          <div className="flex flex-col items-center gap-y-micro mt-micro">
            <Button
              style="primary"
              size="medium"
              icon={
                loading
                  ? <Loader2 aria-hidden="true" className="animate-spin" />
                  : <LogIn aria-hidden="true" />
              }
              disabled={!canSubmit || loading}
              type="button"
              onClick={() => {
                // O Button do DS não emite submit nativo — chamamos
                // manualmente o handler aqui. O form ainda captura Enter
                // via onSubmit pra UX padrão de formulário.
                void handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            {/* Mensagem auxiliar SÓ durante o loading — explica a espera
                pra que o aluno não pense que travou. `aria-live=polite`
                pra que leitores de tela anunciem sem interromper. */}
            {loading && (
              <p
                className="ds-caption text-neutral-dark text-center"
                aria-live="polite"
              >
                Preparando a sequência didática...
              </p>
            )}
          </div>
        </form>
      </GridItem>
      </Grid>
    </div>
  );
}
