'use client';

import { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════
   useOnlineStatus — Hook reativo de conectividade

   DETECÇÃO COMBINADA
     1. Eventos do browser (`online`/`offline`) — reação imediata quando
        o SO sinaliza troca de rede. Praticamente 0ms de latência.
     2. Heartbeat ativo — `fetch` numa URL conhecida a cada N segundos.
        Cobre os casos onde `navigator.onLine` mente:
          • WiFi conectado SEM uplink real (captive portal)
          • Dados móveis com sinal fraco / pacote travando
          • Mudança de operadora intermitente
        Default: 10s de intervalo, 5s de timeout por probe.

   SSR-SAFE / NO HYDRATION MISMATCH
     Estado inicial é SEMPRE `true` (otimista) — server e client
     concordam no primeiro render. O useEffect abaixo sincroniza com
     o estado real apenas APÓS o mount, sem provocar mismatch.

   CONFIGURÁVEL
     • `heartbeatUrl` — endpoint a bater (default: Google generate_204,
       leve e sem CORS). Quando você ligar APIs próprias, troque por
       um `/api/ping` da casa pra testar a conexão real ao backend.
     • `heartbeatIntervalMs` — padrão 10000.
     • `heartbeatTimeoutMs` — padrão 5000.
     • `disableHeartbeat` — desliga o probe (só eventos do browser).
   ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_HEARTBEAT_URL = 'https://www.gstatic.com/generate_204';
// 3s + 3s = detecção em até ~6s no pior caso (queda imediatamente
// depois de um probe bem-sucedido), média ~3s. Trade-off: mais agressivo
// gasta um pouco mais de dados móveis e bateria — se ficar pesado em
// algum cenário específico, é só consumir o hook com overrides:
//   useOnlineStatus({ heartbeatIntervalMs: 5000, heartbeatTimeoutMs: 4000 })
const DEFAULT_HEARTBEAT_INTERVAL_MS = 3_000;
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 3_000;

export interface OnlineStatusOptions {
  heartbeatUrl?: string;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  disableHeartbeat?: boolean;
}

export function useOnlineStatus(options: OnlineStatusOptions = {}): boolean {
  // CRÍTICO: começar SEMPRE `true` (otimista) — server e client renderizam
  // o mesmo HTML inicial (sem overlay), evitando hydration mismatch.
  // O useEffect abaixo corrige pra o estado real depois do mount.
  const [online, setOnline] = useState<boolean>(true);

  const heartbeatUrl = options.heartbeatUrl ?? DEFAULT_HEARTBEAT_URL;
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
  const heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT_MS;
  const disableHeartbeat = options.disableHeartbeat ?? false;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Sincroniza com o estado real após o mount (corrige o `true` otimista
    // do useState inicial caso o aluno tenha entrado offline).
    setOnline(navigator.onLine);

    // 1) Eventos do browser — reação instantânea quando o SO sinaliza
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // 2) Heartbeat ativo
    let cancelled = false;
    let intervalId: number | null = null;
    // Guarda anti-acúmulo: em sessões longas (ex.: 6h) com rede lenta,
    // o setInterval pode disparar um probe novo antes do anterior abortar.
    // Sem essa flag, dezenas de fetches ficam in-flight simultaneamente,
    // tropeçando no limite de connections concorrentes do browser. Com
    // ela, pulamos o tick — não há perda de info (o probe atual vai
    // resolver/abortar logo e o próximo tick segue).
    let probeInFlight = false;

    const probe = async (): Promise<void> => {
      if (probeInFlight) return;
      probeInFlight = true;
      // AbortController garante timeout duro — se o `fetch` ficar
      // pendurado (sem resposta nem erro rápido), abortamos e marcamos
      // offline. Necessário porque algumas redes seguram a request por
      // 30+ segundos antes de falhar.
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), heartbeatTimeoutMs);
      // Cache-busting via query param garante que cada probe REALMENTE
      // vai pra rede (sem cache HTTP intermediário mascarando o estado).
      const url = `${heartbeatUrl}${heartbeatUrl.includes('?') ? '&' : '?'}_=${Date.now()}`;
      try {
        await fetch(url, {
          method: 'GET',
          mode: 'no-cors', // resposta opaca é OK — só nos importa se o fetch chegou
          cache: 'no-store',
          signal: controller.signal,
        });
        window.clearTimeout(timer);
        if (!cancelled) setOnline(true);
      } catch {
        window.clearTimeout(timer);
        if (!cancelled) setOnline(false);
      } finally {
        probeInFlight = false;
      }
    };

    if (!disableHeartbeat) {
      // Probe imediato no mount + intervalo recorrente
      void probe();
      intervalId = window.setInterval(() => void probe(), heartbeatIntervalMs);
    }

    return () => {
      cancelled = true;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [heartbeatUrl, heartbeatIntervalMs, heartbeatTimeoutMs, disableHeartbeat]);

  return online;
}
