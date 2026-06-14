'use client';

import { useState } from 'react';
import { LogOut, KeyRound } from 'lucide-react';
import { Button } from '@/components/global/Button';
import { Modal } from '@/components/global/Modal';
import { Alerts } from '@/components/global/Alerts';
import { useModal } from '@/hooks/global/useModal';
import { useAlerts } from '@/hooks/global/useAlerts';
import { playSound } from '@/hooks/global/useSound';

/**
 * Botão de logout + modal de confirmação por senha.
 *
 * Renderizado SOMENTE quando o aluno está logado — a `page.tsx` da
 * sequência só monta este componente dentro do branch `loggedIn`.
 *
 * Pra evitar logout acidental (especialmente em mobile, onde um toque
 * involuntário no canto seria sumir com o estado da sessão), pedimos
 * a SENHA de acesso novamente no modal. Mesma senha do login —
 * documentada como `LOGOUT_PASSWORD` abaixo pra manter trocas pontuais.
 *
 * O botão fica `fixed bottom-micro right-micro` (canto inferior-direito)
 * com `data-skip-telemetry` na raiz pra que cliques aqui não contem
 * como interações da sequência.
 */

/** Senha que confirma o logout. Atualmente espelha a senha de login
 *  (`@dev@`). Trocar pelo valor real antes da aplicação em sala — pode
 *  ser DIFERENTE da senha de login se quiser dificultar logout
 *  acidental. */
const LOGOUT_PASSWORD = '@dev@';

interface SequenceLogoutProps {
  /** Callback executado quando o aluno confirma logout (senha correta).
   *  A `page.tsx` deve: limpar o flag de `localStorage` + setLoggedIn(false). */
  onLogout: () => void;
}

export function SequenceLogout({ onLogout }: Readonly<SequenceLogoutProps>) {
  const { modal, updateModal } = useModal();
  // Instância própria de alerts — mesmo padrão da PostSequenceForm.
  // Usado pra disparar o toast "Senha incorreta" sobre o modal.
  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Abre o modal num estado SEMPRE limpo — sem senha residual, sem erro
  // anterior. Defesa contra "abri o modal, fechei, reabri e ainda tinha
  // a senha digitada" — confuso e potencialmente perigoso.
  const openModal = () => {
    setPasswordInput('');
    setPasswordError(false);
    updateModal({
      title: 'Confirmar saída',
      status: 'show',
    });
  };

  const handleSubmit = () => {
    if (passwordInput.trim() === LOGOUT_PASSWORD) {
      playSound('/sounds/correct.mp3');
      // Chama direto — o `onLogout` no parent dispara setLoggedIn(false),
      // que troca o conteúdo da página pra tela de login. Este
      // componente desmonta junto, então o modal some sem precisar de
      // close() explícito. A fade-out fica truncada mas o swap pra tela
      // de login é feedback suficiente.
      onLogout();
    } else {
      playSound('/sounds/incorrect.mp3');
      // Toast `error` (vermelho) + erro inline. `silent: true` no 6º
      // param pula o observador da telemetria — não polui o JSON do
      // OVA ativo com pseudo-erros de senha de logout.
      createAlert(
        'Senha incorreta',
        'Confira a senha e tente novamente.',
        'error',
        4000,
        undefined,
        true,
      );
      setPasswordError(true);
    }
  };

  return (
    // `data-skip-telemetry` na raiz: cliques no botão flutuante e em
    // QUALQUER elemento do modal (descendente em React, ancestral via
    // `closest()` no DOM) são ignorados pelo listener global de
    // interações em useTelemetry.ts. Sair do questionário não é parte
    // do percurso pedagógico — não deve inflar contadores.
    <div data-skip-telemetry>
      {/* Toast aboveModal (z-[1100]) — visível enquanto o modal de
          confirmação (z-[1000]) está aberto. */}
      <Alerts
        alerts={alerts}
        updateAlert={updateAlert}
        deleteAlerts={deleteAlerts}
        aboveModal
      />
      {/* Botão INLINE — a `page.tsx` posiciona ele acima da barra de
          progresso e alinhado à direita via container wrapper. Não usa
          `fixed` porque o user-experience pretendido é "ação contextual
          do header" (lê-se como "menu/sair" do espaço logado), não
          "ação flutuante onipresente".
          Visualmente sinalizado como ação "destrutiva" via cor vermelha.
          Transição: 300ms em ease-in-out — suficiente pra ler como
          "deliberado" sem parecer abrupto (200ms estava brusco demais)
          ou lento (400ms+ vira atrito). Listamos as props no
          `transition-[…]` em vez de `transition-all` pra evitar o
          flicker de `transition-all` em mudanças não-anunciadas (ex.:
          quando o foco entra/sai). */}
      <button
        type="button"
        onClick={openModal}
        aria-label="Sair da sequência didática"
        className="inline-flex items-center gap-x-micro
          bg-neutral-white text-feedback-error-dark
          border-thin border-neutral-lighter rounded-md
          pt-nano pb-nano pl-xxxs pr-xxxs
          shadow-level-1
          hover:shadow-level-2
          hover:border-feedback-error-dark
          hover:bg-feedback-error-lightest
          transition-[box-shadow,border-color,background-color,color] duration-300 ease-in-out
          cursor-pointer
          focus-visible:outline-2 focus-visible:outline-feedback-error-dark focus-visible:outline-offset-2"
      >
        <LogOut size={16} aria-hidden="true" />
        <span className="ds-small-bold">Sair</span>
      </button>

      <Modal
        modal={modal}
        updateModal={updateModal}
        footer={({ close }) => (
          <>
            <Button style="secondary" size="small" onClick={close}>
              Cancelar
            </Button>
            <Button
              style="primary"
              size="small"
              onClick={handleSubmit}
              disabled={passwordInput.trim().length === 0}
            >
              Sair
            </Button>
          </>
        )}
      >
        <div className="flex flex-col gap-y-xs">
          <p className="ds-body text-neutral-darkest">
            Você está prestes a sair da sequência didática. Pra
            confirmar, digite a <strong>senha de acesso</strong>{' '}
            novamente. Você precisará logar de novo na próxima vez
            que abrir a página.
          </p>
          <label className="flex flex-col gap-y-nano">
            <span className="ds-small-bold text-neutral-darkest flex items-center gap-x-nano">
              <KeyRound size={14} aria-hidden="true" />
              Senha
            </span>
            <input
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (passwordInput.trim().length > 0) handleSubmit();
                }
              }}
              placeholder="Digite a senha"
              aria-invalid={passwordError}
              aria-describedby={passwordError ? 'logout-senha-error' : undefined}
              className={`ds-body rounded-md p-xxxs border-thin transition-colors duration-200 outline-none
                ${passwordError
                  ? 'border-feedback-error-dark bg-feedback-error-lightest text-feedback-error-darkest focus:border-feedback-error-dark'
                  : 'border-neutral-light bg-neutral-white text-neutral-darkest focus:border-brand-otimath-pure'
                }`}
            />
            {passwordError && (
              <span
                id="logout-senha-error"
                className="ds-small text-feedback-error-dark"
                role="alert"
              >
                Senha incorreta. Tente novamente ou clique em Cancelar.
              </span>
            )}
          </label>
        </div>
      </Modal>
    </div>
  );
}
