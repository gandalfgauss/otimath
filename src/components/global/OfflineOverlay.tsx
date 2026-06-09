'use client';

import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/global/useOnlineStatus';
import { pauseSession, resumeSession } from '@/hooks/teaching/probability/useSequenceSession';
import { telemetryPause, telemetryResume } from '@/hooks/teaching/probability/useTelemetry';

/* ═══════════════════════════════════════════════════════════════════
   OfflineOverlay — Bloqueio de tela quando offline

   Renderiza UM overlay full-screen que cobre toda a UI da sequência
   didática quando o navegador detecta `offline`. Some sozinho assim
   que a conexão volta (evento `online`).

   USO
     Montar uma única vez no nível mais alto possível (page raiz da
     sequência). Não precisa de props — gerencia tudo via `useOnlineStatus`.

   Z-INDEX
     `z-[2000]` — acima de tudo (Header z-99, Alerts z-97, Calculadora
     z-90). Garante que o aluno não consiga interagir com nada por trás.

   ACESSIBILIDADE
     • `role="dialog" aria-modal="true"` — anuncia como modal a leitores
       de tela.
     • Foco não é trapado (não há controles dentro): o aluno só pode
       esperar a conexão voltar.
   ═══════════════════════════════════════════════════════════════════ */

export function OfflineOverlay() {
  const online = useOnlineStatus();

  // Pausa cronômetros enquanto offline. Lifecycle do useEffect:
  //   • online=true (caso comum): cleanup vazio, effect retorna sem fazer nada.
  //   • online vira false: registra cleanup que retomará no próximo flip.
  //     Chama pauseSession + telemetryPause AGORA.
  //   • online vira true: cleanup do passo anterior dispara
  //     (resumeSession + telemetryResume). Effect novo é no-op.
  useEffect(() => {
    if (online) return;
    pauseSession();
    telemetryPause();
    return () => {
      resumeSession();
      telemetryResume();
    };
  }, [online]);

  if (online) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-overlay-title"
      aria-describedby="offline-overlay-description"
      className="fixed inset-0 z-[2000] flex items-center justify-center p-xxxs"
      style={{
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="bg-neutral-white rounded-md p-xxs text-center"
        style={{
          maxWidth: 460,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.32)',
        }}
      >
        <div
          aria-hidden="true"
          className="flex justify-center mb-micro"
          style={{ color: 'var(--color-feedback-error-dark)' }}
        >
          <WifiOff size={56} strokeWidth={1.8} />
        </div>
        <p
          id="offline-overlay-title"
          className="ds-heading-extra text-feedback-error-darkest mb-micro"
        >
          Sem conexão com a internet
        </p>
        <p
          id="offline-overlay-description"
          className="ds-body text-neutral-darkest mb-micro text-justify"
          style={{ lineHeight: 1.55 }}
        >
          A sequência didática precisa de internet pra carregar recursos e
          registrar seu progresso. Verifique sua conexão e tente novamente.
        </p>
        <p className="ds-small text-neutral-dark italic">
          Esta mensagem desaparece automaticamente assim que a conexão voltar.
        </p>
      </div>
    </div>
  );
}
