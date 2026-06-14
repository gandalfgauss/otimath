import { useCallback, useState} from 'react';
import { AlertType, AlertInterface } from '@/components/global/Alert';

/* ─────────────────────────────────────────────────────────────────
   Observador global de alertas
   ───────────────────────────────────────────────────────────────────
   Permite que módulos transversais (ex.: `useSequenceSession`)
   recebam notificação de TODO alerta criado, sem precisar envolver
   cada `createAlert` espalhado pelos hooks dos OVAs. Útil para
   registrar tentativas/erros/acertos no log persistente da sequência
   didática sem auditar dezenas de validators.
   ───────────────────────────────────────────────────────────────── */

/** Callback dos observadores de alerta.
 *
 *  `userResponse` carrega a resposta REAL do usuário (o que ele
 *  marcou/escreveu/escolheu) quando o validator passou esse argumento
 *  no `createAlert`. Quando não passou, fica `undefined` e o consumidor
 *  decide o fallback (geralmente usar o `title`). Útil pra telemetria:
 *  a telemetria precisa registrar a resposta do aluno, e o título do
 *  alerta ("Tente novamente") não é a resposta do aluno. */
type AlertObserver = (type: AlertType, title: string, userResponse?: string) => void;
const alertObservers: AlertObserver[] = [];

/** Inscreve um observador para todos os alertas criados via
 *  `useAlerts().createAlert`. Retorna função de desinscrição. */
export function subscribeToAlerts(fn: AlertObserver): () => void {
  alertObservers.push(fn);
  return () => {
    const i = alertObservers.indexOf(fn);
    if (i >= 0) alertObservers.splice(i, 1);
  };
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<AlertInterface[]>([]);

  /**
   * @param userResponse Opcional. Quando validators chamam alerts de
   *   `success` ou `error`, é interessante registrar o que o ALUNO marcou
   *   /escreveu na telemetria (ex.: `"slider em 5"`, `"P = 7/36"`). Esse
   *   5º parâmetro repassa ao observador (vide subscribeToAlerts) sem
   *   afetar o display do toast.
   * @param silent Opcional, default `false`. Quando `true`, o alerta é
   *   exibido normalmente mas os observadores (telemetria etc.) NÃO são
   *   notificados. Use em alerts que carregam tipo `error`/`success`
   *   mas conceitualmente NÃO são respostas a exercícios — ex.: erro
   *   de senha do questionário pós-sequência. Sem este flag, esses
   *   eventos virariam pseudo-erros no JSON de telemetria do OVA ativo
   *   (poluiriam o dataset). Não afeta o display do toast.
   */
  const createAlert = useCallback((title: string, description: string, type: AlertType, timeout: number = 3000, userResponse?: string, silent: boolean = false) => {
    setAlerts(prev => [...prev, {title: title, description:description, type: type, status: "show", timeout: timeout}]);
    if (silent) return;
    // Notifica observadores síncronos. Erros nos observers não devem
    // quebrar a criação do alerta — engolimos defensivamente.
    for (const obs of alertObservers) {
      try { obs(type, title, userResponse); } catch { /* ignorar */ }
    }
  }, []);

  const deleteAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const updateAlert = useCallback((index: number, alert : AlertInterface) => {
    setAlerts(prev => {
      const updateAlerts = [...prev];
      updateAlerts[index] = alert;
      return updateAlerts;
    });
  }, []);

  return {alerts, createAlert, updateAlert, deleteAlerts}
}