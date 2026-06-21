/* ═══════════════════════════════════════════════════════════════
   devConsole — toggle global pra silenciar console.log/warn/info.

   POR QUE EXISTE
     O OVA dos Dois Dados emite MUITOS logs durante o desenvolvimento
     (telemetria, snapshots, debug). Em sessões de demonstração ou
     QA prolongado, o console fica intransitável. Esse módulo dá ao
     pesquisador um toggle pra silenciar TODOS os logs sem precisar
     do filter da DevTools.

   COMO FUNCIONA
     • `initDevConsole()` é chamado UMA vez no mount do app. Captura
       as referências NATIVAS do console e instala wrappers que
       checam a flag `enabled` a cada call.
     • `setConsoleLogsEnabled(bool)` flipa a flag e persiste em
       localStorage. NÃO precisa reload — os wrappers já estão
       instalados e consultam a flag dinamicamente.
     • `isConsoleLogsEnabled()` lê a flag (pra UI refletir estado).

   PROTEÇÕES
     • `console.error` NUNCA é wrappado — erros precisam aparecer
       sempre, são essenciais pra debug.
     • Init é idempotente — múltiplas chamadas não re-wrappam.
     • localStorage ausente (SSR) → fallback pra default `true`.

   LIÇÃO DA SEQUÊNCIA HABILITADA/DESABILITADA
     O bug anterior (perder interações ao desligar+ligar sem F5)
     vinha de listeners que dependiam de uma flag capturada via
     closure no momento do mount. Aqui evitamos isso: os wrappers
     leem `enabled` POR REFERÊNCIA a cada call (não captura), então
     o toggle reflete imediatamente sem reinstalação.
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'otimath_dev_console_logs_enabled';

let enabled = true;
let installed = false;

function readPref(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return true;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

export function isConsoleLogsEnabled(): boolean {
  return enabled;
}

export function setConsoleLogsEnabled(v: boolean): void {
  enabled = v;
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, String(v));
  } catch {
    // localStorage cheio ou desabilitado — silencioso.
  }
}

export function initDevConsole(): void {
  if (installed) return;
  if (typeof console === 'undefined') return;
  installed = true;
  enabled = readPref();

  // Captura referências NATIVAS — wrappers chamam essas.
  const nativeLog = console.log.bind(console);
  const nativeWarn = console.warn.bind(console);
  const nativeInfo = console.info.bind(console);
  const nativeDebug = console.debug.bind(console);

  // Wrappers consultam `enabled` por closure por referência (variável
  // module-scope) — toggle reflete imediatamente, sem reinstalar.
  console.log = (...args: unknown[]) => { if (enabled) nativeLog(...args); };
  console.warn = (...args: unknown[]) => { if (enabled) nativeWarn(...args); };
  console.info = (...args: unknown[]) => { if (enabled) nativeInfo(...args); };
  console.debug = (...args: unknown[]) => { if (enabled) nativeDebug(...args); };
  // `console.error` permanece intocado — erros sempre devem aparecer.
}
