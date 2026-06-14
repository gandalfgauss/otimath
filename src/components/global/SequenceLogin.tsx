'use client';

import { useState } from 'react';
import { Lock, User, LogIn, KeyRound, Loader2 } from 'lucide-react';
import { Grid } from '@/components/global/Grid';
import { GridItem } from '@/components/global/GridItem';
import { Button } from '@/components/global/Button';

/**
 * Tela de login da Sequência Didática.
 *
 * Renderizada NO LUGAR do conteúdo gateado (barra de progresso, OVAs,
 * questionário, créditos) enquanto o aluno não está logado. Banner
 * (hero), menu e rodapé continuam visíveis em volta — quem orquestra
 * isso é o `page.tsx` da sequência.
 *
 * O acesso é client-side: a comparação acontece no browser contra
 * constantes embutidas no bundle. Isso é proteção contra ACESSO
 * CASUAL (não contra ator malicioso). Pra blindagem real, mover a
 * validação pra um endpoint server-side com cookie HTTP-only.
 *
 * Persistência: o `page.tsx` cuida do flag em `localStorage`. Esta tela
 * só dispara `onLogin()` quando as credenciais batem.
 */

/** Usuário válido. Substituir pelo valor de produção antes da
 *  aplicação em sala. */
const VALID_USERNAME = '@dev@';
/** Senha válida. Substituir pelo valor de produção antes da
 *  aplicação em sala. Comparação case-sensitive; trim só no usuário
 *  (senha pode legitimamente ter espaços). */
const VALID_PASSWORD = '@dev@';

interface SequenceLoginProps {
  /** Disparado quando o aluno acerta usuário+senha. O parent é
   *  responsável por mudar o estado de login (e persistir, se quiser). */
  onLogin: () => void;
}

export function SequenceLogin({ onLogin }: Readonly<SequenceLoginProps>) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  // Estado "Entrando..." — sinaliza progresso enquanto a sequência
  // monta. A montagem dos OVAs envolve hooks pesados (3500+ linhas de
  // estado em useRouletteHooks, vários useEffect de hidratação, etc.)
  // e bloqueia o thread de UI por ~200-500ms dependendo do dispositivo.
  // Sem indicador, o aluno clica e o botão "trava" sem feedback.
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    if (username.trim() === VALID_USERNAME && password === VALID_PASSWORD) {
      // 2 passos pra que o spinner SEJA PINTADO antes da montagem pesada:
      //   1. setLoading(true) agenda re-render com o spinner.
      //   2. setTimeout(0) joga o `onLogin()` (que dispara o swap
      //      pra sequência) pro próximo tick do event loop — o browser
      //      pinta o spinner ANTES de iniciar o trabalho pesado.
      // Sem o setTimeout, React bateria os 2 updates de estado no mesmo
      // microtask e o spinner nunca apareceria — só "trava" e pula.
      setLoading(true);
      setTimeout(() => {
        onLogin();
        // Sem setLoading(false) — o componente já vai desmontar quando
        // o parent trocar pro conteúdo da sequência.
      }, 0);
    } else {
      setError(true);
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
              acadêmica do PROFMAT</strong>. Use o usuário e a senha que o
              pesquisador combinou com você pra começar.
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
                if (error) setError(false);
              }}
              placeholder="Digite o usuário fornecido"
              aria-invalid={error}
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
                if (error) setError(false);
              }}
              placeholder="Digite a senha fornecida"
              aria-invalid={error}
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
                Usuário ou senha incorretos. Confira com o pesquisador e tente novamente.
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
                handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
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

          {/* Microcopy de tom + recurso de recuperação informal. */}
          <p className="ds-caption text-neutral-dark italic text-center">
            Esqueceu o acesso? Entre em contato com o pesquisador
            responsável pra recuperar suas credenciais.
          </p>
        </form>
      </GridItem>
      </Grid>
    </div>
  );
}
