'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { HeroBanner } from "@/components/global/HeroBanner";
import { OvaCredits } from "@/components/global/OvaCredits";
import { PostSequenceForm } from "@/components/global/PostSequenceForm";
import { SequenceLogin } from "@/components/global/SequenceLogin";
import { SequenceLogout } from "@/components/global/SequenceLogout";
import { TextBlock } from "@/components/global/TextBlock";
import { Button } from "@/components/global/Button";
import { Grid } from "@/components/global/Grid";
import { GridItem } from "@/components/global/GridItem";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { RouletteGame } from "@/components/teaching/probability/roulette/RouletteGame";
import { TwoDicesPresentation } from "@/components/teaching/probability/two-dices/TwoDicesPresentation";
import { StudyMenu } from "@/components/teaching/probability/two-dices/shared/StudyMenu";
import {
  DISCO_GLOSSARY,
  DISCO_GROUPS,
  DOIS_DADOS_GLOSSARY,
  DOIS_DADOS_GROUPS,
} from "@/components/teaching/probability/two-dices/shared/studyMenuContent";
import { SequenceProgressBar } from "@/components/teaching/probability/SequenceProgressBar";
import { SequenceStatsCard } from "@/components/teaching/probability/SequenceStatsCard";
import {
  startSequence,
  setActiveOva,
  endSequence,
  getSequenceStats,
  useSequenceTick,
} from "@/hooks/teaching/probability/useSequenceSession";
import { telemetrySetDevMode } from "@/hooks/teaching/probability/useTelemetry";
import { playSound } from "@/hooks/global/useSound";
import { useAlerts } from "@/hooks/global/useAlerts";
import { Alerts } from "@/components/global/Alerts";
import { OfflineOverlay } from "@/components/global/OfflineOverlay";
import heroBannerProbabilityImage from '@/images/teaching/probability/probabilityBanner.webp';

type Stage = 'intro' | 'roulette' | 'transition' | 'twoDices' | 'complete';

const STAGES: Stage[] = ['intro', 'roulette', 'transition', 'twoDices', 'complete'];
const STAGE_LABELS: Record<Stage, string> = {
  intro:      'Introdução',
  roulette:   'OVA — Disco Aleatório',
  transition: 'Transição entre OVAs',
  twoDices:   'OVA — Dois Dados',
  complete:   'Conclusão',
};

export default function DidacticSequencePage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [devMode, setDevMode] = useState(false);

  // ─── Login gate (3-state) ───────────────────────────────────────
  // O conteúdo "interno" (barra de progresso, OVAs, questionário e
  // créditos) só aparece depois de o aluno se autenticar. Banner (hero),
  // menu e rodapé continuam visíveis em volta — fornecem identidade e
  // navegação enquanto o aluno chega.
  //
  // Persistência em localStorage pra que o aluno não precise logar
  // toda vez que abrir a página (UX de pesquisa, não de banco).
  //
  // ESTADO DE 3 FASES — evita o "flash do login screen" que aparecia
  // antes pra quem JÁ estava logado:
  //   • 'checking' — inicial (SSR + primeiro render no client).
  //     Renderiza placeholder de loading. Esse estado COBRE também o
  //     intervalo entre `setLoginState('logged-in')` e o commit da
  //     árvore pesada da sequência (React mantém o render anterior
  //     na tela enquanto faz a transição).
  //   • 'logged-out' — sem credencial salva → mostra SequenceLogin.
  //   • 'logged-in' — credencial válida no localStorage → mostra
  //     todo o conteúdo da sequência.
  //
  // SSR-SAFE: o estado inicial é sempre 'checking' (server + client
  // concordam), e o useEffect abaixo lê o localStorage só no client.
  type LoginState = 'checking' | 'logged-in' | 'logged-out';
  const [loginState, setLoginState] = useState<LoginState>('checking');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('otimath-seq-loggedIn');
    setLoginState(stored === 'true' ? 'logged-in' : 'logged-out');
  }, []);
  const handleLogin = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('otimath-seq-loggedIn', 'true');
    }
    setLoginState('logged-in');
  }, []);
  // Logout: limpa o flag persistido + cai pro `SequenceLogin`. Não
  // resetamos estado dos OVAs aqui — eles vão desmontar/remontar
  // quando o aluno relogar; estado é reinicializado naturalmente.
  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('otimath-seq-loggedIn');
    }
    setLoginState('logged-out');
  }, []);

  // Silencia a telemetria enquanto o painel DEV está aberto — navegação
  // via setas, jumps de subStep e cliques nos controles DEV não devem
  // poluir a coleta real do aluno. O contexto (enter/exit/section)
  // continua sendo rastreado, só a GRAVAÇÃO de eventos é pulada.
  useEffect(() => {
    telemetrySetDevMode(devMode);
  }, [devMode]);
  // Progresso interno do OVA ativo (0..1) — reportado pelos OVAs via
  // callback `onProgressChange`. Mapeado para a faixa global do estágio
  // (roulette: 0→0.25; twoDices: 0.5→0.75) na barra do topo.
  const [rouletteProgress, setRouletteProgress] = useState(0);
  const [twoDicesProgress, setTwoDicesProgress] = useState(0);
  const ovaContainerRef = useRef<HTMLDivElement>(null);

  // Posição global na trilha (0..1) — combina o estágio atual com o
  // progresso interno do OVA correspondente. Os 5 marcos da barra ficam
  // em 0%, 25%, 50%, 75%, 100%. Cada OVA começa NO seu próprio marco e
  // enche em direção ao próximo (Disco: 25→<50%; Dois Dados: 75→<100%).
  // O `min(0.49, …)` / `min(0.99, …)` garante que o preenchimento
  // visual NUNCA atinja o marco seguinte antes do aluno realmente sair
  // do OVA — sem esse cap, no fim da Etapa 3 do Disco o progress=1.0
  // mapeava para 50% global e parecia que o aluno já estava na
  // "Transição" mesmo ainda dentro do OVA.
  const stageIndex = STAGES.indexOf(stage);
  const globalProgress = (() => {
    switch (stage) {
      case 'intro':      return 0;
      case 'roulette':   return Math.min(0.49, 0.25 + rouletteProgress * 0.25);
      case 'transition': return 0.5;
      case 'twoDices':   return Math.min(0.99, 0.75 + twoDicesProgress * 0.25);
      case 'complete':   return 1;
    }
  })();

  // ── Desabilita o "puxar-para-recarregar" do mobile enquanto o aluno
  // está na sequência didática. Sem isso, um arraste acidental pra baixo
  // no topo da página recarrega tudo e o progresso é perdido. Aplicado
  // em <html> e <body> porque navegadores diferentes ouvem em locais
  // diferentes (Chrome Android: html; Safari iOS: body). Restaurado no
  // unmount para não vazar o efeito para outras páginas do site.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehaviorY;
    const prevBody = body.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = 'contain';
    body.style.overscrollBehaviorY = 'contain';
    return () => {
      html.style.overscrollBehaviorY = prevHtml;
      body.style.overscrollBehaviorY = prevBody;
    };
  }, []);

  // Ao entrar nas fases dos OVAs ou na transição, rola até o início do bloco
  useEffect(() => {
    if (stage === 'intro') return;
    requestAnimationFrame(() => {
      ovaContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [stage]);

  // Sistema de alerts ao nível da página — usado pra mostrar a celebração
  // "🏆 Sequência didática concluída!" QUANDO a tela final monta (não
  // condicionada ao clique de "Finalizar OVA"). Abordagem mais simples
  // que a anterior, que tentava disparar o alert dentro do TwoDicesPresentation
  // e precisava de delay pra sobreviver à desmontagem da árvore.
  const { alerts, createAlert, updateAlert, deleteAlerts } = useAlerts();

  // Som + alert de conclusão ao chegar na tela final
  useEffect(() => {
    if (stage === 'complete') {
      playSound('/sounds/gameFinished.mp3');
      createAlert(
        '🏆 Sequência didática concluída!',
        'Parabéns! Você completou a sequência didática inteira de Probabilidade.',
        'success',
        6000,
      );
    }
  }, [stage, createAlert]);

  // Lifecycle da sessão a nível de stage:
  //  • `startSequence()` é idempotente — chamado defensivamente para
  //    cobrir saltos via DEV que não passaram pelo botão "Iniciar".
  //  • `endSequence()` ao entrar em 'complete' congela tudo.
  //  • Para 'roulette'/'twoDices' NÃO chamamos `setActiveOva` aqui —
  //    cada OVA reivindica/libera seu próprio cronômetro via prop
  //    `isActiveStage`. Isso permite que `freezeOva` na tela final
  //    do OVA não seja sobrescrito por um setActiveOva aqui.
  useEffect(() => {
    if (stage !== 'intro') startSequence();
    if (stage === 'complete')                                  endSequence();
    else if (stage === 'intro' || stage === 'transition')      setActiveOva(null);
  }, [stage]);

  const goToStage = useCallback((target: Stage) => setStage(target), []);

  // "Iniciar a sequência didática" — botão único que dispara o
  // cronômetro global e limpa logs prévios para que as estatísticas
  // da nova sessão fiquem isoladas.
  const handleStartSequence = useCallback(() => {
    startSequence();
    goToStage('roulette');
  }, [goToStage]);

  // Callbacks dos OVAs memoizados — refs estáveis. Sem isso, a função
  // lambda recriada a cada render alimentaria o `FinishedSignal` interno
  // do OVA com uma nova referência a cada navegação DEV, disparando o
  // efeito de finalização de novo e jogando o usuário de volta para a
  // tela final, mesmo após pressionar a seta de voltar.
  const handleRouletteFinished = useCallback(() => goToStage('transition'), [goToStage]);
  const handleTwoDicesFinished = useCallback(() => goToStage('complete'), [goToStage]);

  // Renderização: enquanto o devMode estiver ativo, mantemos todas as cenas
  // montadas (com display:none nas que não são a atual) para preservar o
  // estado interno dos OVAs ao navegar entre cenas. Fora do devMode, a renderização
  // permanece condicional como no fluxo normal.
  const renderStage = (s: Stage) => {
    switch (s) {
      case 'intro':
        return <IntroSection onStart={handleStartSequence} />;
      case 'roulette':
        return (
          <Grid id="seq-roleta" paddings="pt-xl pb-xl" rowGaps="gap-y-xxs" backgroundColor="bg-brand-otimath-lightest">
            <GridItem styles="text-center" cols="col-[3_/_11] max-sm:col-[1_/_13]">
              <TextBlock
                title={<h2 className="ds-heading-ultra">Simulador Probabilístico com Disco Aleatório</h2>}
              />
            </GridItem>
            <GridItem cols="col-[1_/_13]">
              <RouletteGame
                onFinished={handleRouletteFinished}
                devMode={devMode}
                onProgressChange={setRouletteProgress}
                isActiveStage={stage === 'roulette'}
              />
            </GridItem>
          </Grid>
        );
      case 'transition':
        return <TransitionSection onContinue={() => goToStage('twoDices')} />;
      case 'twoDices':
        return (
          <Grid id="seq-dois-dados" paddings="pt-xl pb-xl" rowGaps="gap-y-xxs" backgroundColor="bg-brand-otimath-lightest">
            <GridItem styles="text-center" cols="col-[3_/_11] max-sm:col-[1_/_13]">
              <TextBlock
                title={<h2 className="ds-heading-ultra">Probabilidade: Dois Dados</h2>}
              />
            </GridItem>
            <GridItem cols="col-[1_/_13]">
              <TwoDicesPresentation
                onFinished={handleTwoDicesFinished}
                devMode={devMode}
                onProgressChange={setTwoDicesProgress}
                isActiveStage={stage === 'twoDices'}
              />
            </GridItem>
          </Grid>
        );
      case 'complete':
        return <CompletionSection />;
    }
  };

  return (
    <main>
      {/* Overlay global de alerts da página da sequência. Renderizado no topo
          do <main> pra ficar visível em qualquer stage (intro, OVAs, complete). */}
      <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts} />
      <HeroBanner
        id="hero-banner"
        textBlock={
          <TextBlock
            overline="TRILHA DE APRENDIZAGEM ESTRUTURADA"
            title={<h1 className="ds-heading-giga">Sequência Didática: do fenômeno ao símbolo</h1>}
            paragraph={
              <p className="ds-body">
                Percorra os dois OVAs encadeados — Disco e Dois Dados — em uma única trilha
                contínua, do experimento aleatório à formalização probabilística.
              </p>
            }
            maxWidthParagraph="max-w-[460px]"
            inverse={true}
          />
        }
        image={heroBannerProbabilityImage}
      />

      {/* Conteúdo gateado por login — só aparece após autenticação.
          Banner (hero) acima fica visível independente do login pra dar
          identidade enquanto o aluno chega; menu e rodapé do layout
          também. */}
      {loginState === 'checking' ? (
        // ─── PLACEHOLDER DE LOADING ───────────────────────────────
        // Aparece em 2 momentos:
        //   1. Render SSR + primeiro render no client (antes do
        //      useEffect ler o localStorage).
        //   2. Transição entre `setLoginState('logged-in')` e o
        //      commit da árvore pesada da sequência — React mantém
        //      o último render na tela durante a reconciliação, então
        //      o loading "cobre" o atraso de mount dos OVAs.
        // Mesma linguagem visual do SequenceLogin (gradient-level-5
        // + card central) pra que a transição quando o status muda
        // pareça contínua. */
        <Grid paddings="pt-xl pb-xl" backgroundColor="bg-linear-(--color-gradient-level-5)">
          <GridItem cols="col-[4_/_10] max-md:col-[2_/_12] max-sm:col-[1_/_13]">
            <div
              className="rounded-lg shadow-level-1 bg-linear-(--color-gradient-level-1) p-xs flex flex-col items-center gap-y-xs text-center"
              role="status"
              aria-live="polite"
            >
              <div className="w-14 h-14 rounded-full bg-brand-otimath-lightest flex items-center justify-center">
                <Loader2
                  size={28}
                  className="text-brand-otimath-pure animate-spin"
                  aria-hidden="true"
                />
              </div>
              <span className="ds-overline text-brand-otimath-pure tracking-wider">
                CARREGANDO
              </span>
              <h2 className="ds-heading-mega text-brand-otimath-dark max-w-[480px]">
                Preparando a sequência didática
              </h2>
              <div className="w-12 h-0.5 bg-brand-otimath-pure rounded-full" />
              <p className="ds-body text-neutral-darkest max-w-[480px] leading-relaxed">
                Verificando seu acesso e carregando os OVAs. Isso leva
                só alguns instantes.
              </p>
            </div>
          </GridItem>
        </Grid>
      ) : loginState === 'logged-in' ? (
        <>
          {/* Faixa acima da barra de progresso — alinha o botão de
              logout à direita. Padding lateral espelha o do Grid (col 1
              de 13) pra ficar bem no canto, sem grudar na borda. */}
          <div className="flex justify-end pt-micro pb-micro pl-xxs pr-xxs">
            <SequenceLogout onLogout={handleLogout} />
          </div>
          {/* Barra de progresso da trilha — bloco normal, rola junto com a
              página. Posicionada logo abaixo do banner para servir de
              cabeçalho dos cinco marcos (Início → OVA do Disco → Transição →
              OVA Dois Dados → Fim) e do preenchimento contínuo dentro de
              cada OVA. */}
          <SequenceProgressBar progress={globalProgress} currentStageIndex={stageIndex} />

          {/* `relative` + `OfflineOverlay` aqui dentro: quando a internet cai,
              o overlay cobre APENAS o miolo das cenas (este div), preservando
              a barra de progresso acima e o que vier abaixo (PostSequenceForm,
              OvaCredits, DevPanel). */}
          <div ref={ovaContainerRef} className="relative">
            <OfflineOverlay />
            {STAGES.map(s => (
              <div key={s} className={stage === s ? 'block' : 'hidden'}>
                {(stage === s || devMode) && renderStage(s)}
              </div>
            ))}
          </div>

          <PostSequenceForm/>

          <OvaCredits/>

          <DevPanel
            devMode={devMode}
            setDevMode={setDevMode}
            stage={stage}
            goToStage={goToStage}
          />
        </>
      ) : (
        <SequenceLogin onLogin={handleLogin} />
      )}
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────
// Painel de desenvolvimento (oculto por trás de um botão quase invisível
// + senha "@dev@"). Permite navegar livremente entre as cenas para fins
// de QA/demonstração sem refazer todo o fluxo.
// ─────────────────────────────────────────────────────────────────
function DevPanel({
  devMode, setDevMode, stage, goToStage,
}: {
  devMode: boolean;
  setDevMode: (v: boolean) => void;
  stage: Stage;
  goToStage: (s: Stage) => void;
}) {
  const [inputVisible, setInputVisible] = useState(false);
  const [secret, setSecret] = useState('');
  const [jumpInput, setJumpInput] = useState('');
  const secretInputRef = useRef<HTMLInputElement>(null);

  const currentIdx = STAGES.indexOf(stage);
  const total = STAGES.length;

  useEffect(() => {
    if (inputVisible) secretInputRef.current?.focus();
  }, [inputVisible]);

  const handleSecretChange = (val: string) => {
    setSecret(val);
    if (val === '@dev@') {
      setDevMode(true);
      setInputVisible(false);
      setSecret('');
    }
  };

  const handleClose = () => {
    setDevMode(false);
    setInputVisible(false);
    setSecret('');
    setJumpInput('');
  };

  const goPrev = () => { if (currentIdx > 0) goToStage(STAGES[currentIdx - 1]); };
  const goNext = () => { if (currentIdx < total - 1) goToStage(STAGES[currentIdx + 1]); };
  const handleJump = () => {
    const n = parseInt(jumpInput, 10);
    if (Number.isNaN(n) || n < 1 || n > total) return;
    goToStage(STAGES[n - 1]);
    setJumpInput('');
  };

  if (devMode) {
    return (
      <div
        // Cliques no painel DEV não fazem parte do percurso pedagógico —
        // ignorados pelo listener global de interações em useTelemetry.ts
        // (que já tem o `if (devModeActive) return;` em todas APIs de
        // gravação, mas o contador global de cliques é separado).
        data-skip-telemetry
        className="fixed top-1/2 -translate-y-1/2 left-micro z-50 bg-neutral-white p-micro rounded-md shadow-lg border border-neutral-light flex flex-col gap-y-micro min-w-[220px]"
        role="region"
        aria-label="Painel de desenvolvimento da sequência didática"
      >
        <div className="flex items-center justify-between gap-x-micro">
          <span className="ds-caption text-brand-otimath-dark font-bold">DEV — Sequência</span>
          <button
            onClick={handleClose}
            aria-label="Fechar painel de desenvolvimento"
            className="text-neutral-dark hover:text-feedback-error-dark cursor-pointer transition-colors duration-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="text-center">
          <p className="ds-caption text-neutral-dark">Cena {currentIdx + 1} de {total}</p>
          <p className="ds-small-bold text-brand-otimath-pure">{STAGE_LABELS[stage]}</p>
        </div>

        <div className="flex items-center justify-between gap-x-micro">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            aria-label="Cena anterior"
            className="flex items-center justify-center w-8 h-8 rounded-md border border-neutral-light text-brand-otimath-dark cursor-pointer hover:bg-brand-otimath-lightest disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            onClick={goNext}
            disabled={currentIdx === total - 1}
            aria-label="Próxima cena"
            className="flex items-center justify-center w-8 h-8 rounded-md border border-neutral-light text-brand-otimath-dark cursor-pointer hover:bg-brand-otimath-lightest disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-x-quarck">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={total}
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJump(); }}
            placeholder={`1-${total}`}
            aria-label="Pular para cena de número"
            className="w-full px-quarck py-quarck rounded-md border border-neutral-light ds-small text-center outline-none focus:border-brand-otimath-pure"
          />
          <button
            onClick={handleJump}
            disabled={!jumpInput}
            className="px-micro py-quarck rounded-md bg-brand-otimath-pure text-neutral-white ds-small-bold cursor-pointer hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-brand-otimath-dark"
          >
            Ir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      // Cliques na bolinha de acesso ao DEV + input de senha são
      // ignorados pelo contador global de interações.
      data-skip-telemetry
      className="fixed bottom-xs right-xs z-50 flex items-center gap-x-quarck"
    >
      {inputVisible && (
        <input
          ref={secretInputRef}
          type="password"
          value={secret}
          onChange={(e) => handleSecretChange(e.target.value)}
          onBlur={() => { if (!secret) setInputVisible(false); }}
          placeholder="..."
          aria-label="Senha de desenvolvimento"
          className="w-24 px-micro py-quarck rounded-md border border-neutral-light ds-small text-center outline-none focus:border-brand-otimath-pure bg-neutral-white shadow-sm"
        />
      )}
      <button
        onClick={() => setInputVisible(v => !v)}
        aria-label="Acesso ao painel de desenvolvimento"
        className="w-3 h-3 rounded-full bg-neutral-darkest opacity-15 hover:opacity-70 focus:opacity-70 cursor-pointer transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Subseções
// ─────────────────────────────────────────────────────────────────

function IntroSection({ onStart }: { onStart: () => void }) {
  return (
    <Grid id="seq-intro" paddings="pt-xl pb-xl" backgroundColor="bg-linear-(--color-gradient-level-5)">
      <GridItem styles="text-center" cols="col-[3_/_11] max-md:col-[1_/_13]">
        <div className="flex flex-col items-center gap-y-xs">
          <SequenceIllustration />
          <TextBlock
            centralize
            overline="VAMOS COMEÇAR"
            title={<h2 className="ds-heading-ultra">Você está pronto para iniciar a sequência?</h2>}
            paragraph={
              <span className="ds-body block text-center">
                A trilha é composta por <strong>dois OVAs encadeados</strong>:
                <br /><br />
                <strong>1. Disco Aleatório</strong> — você explora a probabilidade como limite
                da frequência relativa por meio de simulações com um disco colorido.
                <br /><br />
                <strong>2. Dois Dados</strong> — você sistematiza o cálculo de probabilidades
                em um espaço amostral equiprovável investigando o lançamento de dois dados.
                <br /><br />
                Ao final dos dois, você terá percorrido o caminho do fenômeno aleatório à
                formalização probabilística. Quando estiver pronto, comece pelo Disco.
              </span>
            }
            maxWidthParagraph="max-w-[640px]"
          />
          <Button style="primary" size="medium" icon={<ArrowRight />} onClick={onStart}>
            Iniciar a sequência didática
          </Button>
        </div>
      </GridItem>
    </Grid>
  );
}

// SVG ilustrativo do conteúdo da sequência: disco aleatório à esquerda,
// seta indicando progressão, e dois dados (verde + azul) à direita —
// representando os dois OVAs encadeados da trilha.
function SequenceIllustration() {
  return (
    <svg
      role="img"
      aria-label="Ilustração da sequência: disco dividido em setores coloridos seguido por dois dados (verde e azul)"
      viewBox="0 0 380 160"
      className="w-full max-w-[420px] h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Sombra suave compartilhada por disco e dados */}
        <filter id="seq-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
          <feOffset dx="0" dy="3" result="offsetBlur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Gradiente do dado verde */}
        <linearGradient id="seq-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a8844" />
          <stop offset="100%" stopColor="#1a5c2e" />
        </linearGradient>
        {/* Gradiente do dado azul */}
        <linearGradient id="seq-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b5fc7" />
          <stop offset="100%" stopColor="#1a3f9e" />
        </linearGradient>
      </defs>

      {/* ───────── Disco aleatório (lado esquerdo) ───────── */}
      <g transform="translate(80, 80)" filter="url(#seq-shadow)">
        {/* 6 setores em cores brand */}
        <path d="M 0 0 L 50 0 A 50 50 0 0 1 25 43.3 Z" fill="#e03b3b" />
        <path d="M 0 0 L 25 43.3 A 50 50 0 0 1 -25 43.3 Z" fill="#1a4a9e" />
        <path d="M 0 0 L -25 43.3 A 50 50 0 0 1 -50 0 Z" fill="#f4c430" />
        <path d="M 0 0 L -50 0 A 50 50 0 0 1 -25 -43.3 Z" fill="#2a8844" />
        <path d="M 0 0 L -25 -43.3 A 50 50 0 0 1 25 -43.3 Z" fill="#7d3c98" />
        <path d="M 0 0 L 25 -43.3 A 50 50 0 0 1 50 0 Z" fill="#e87c1c" />
        {/* Aro escuro */}
        <circle cx="0" cy="0" r="50" fill="none" stroke="#2e2e2e" strokeWidth="2.5" />
        {/* Pino central */}
        <circle cx="0" cy="0" r="6" fill="#2e2e2e" />
        <circle cx="0" cy="0" r="2.5" fill="#fff" />
        {/* Ponteiro/seta apontando para cima */}
        <path d="M 0 -55 L -5 -45 L 5 -45 Z" fill="#2e2e2e" stroke="#fff" strokeWidth="0.8" />
      </g>

      {/* ───────── Conector (seta entre OVAs) ───────── */}
      <g transform="translate(190, 80)" stroke="#1a4a9e" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7">
        <line x1="-25" y1="0" x2="20" y2="0" strokeDasharray="4 3" />
        <polyline points="14,-6 22,0 14,6" />
      </g>

      {/* ───────── Dois dados (lado direito) ───────── */}
      {/* Dado verde — face 5 */}
      <g transform="translate(265, 80) rotate(-8)" filter="url(#seq-shadow)">
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="url(#seq-green)" />
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="none" stroke="#0e3d1f" strokeWidth="1.2" />
        {/* Pintas (face 5) */}
        <circle cx="-13" cy="-13" r="3.5" fill="#fff" />
        <circle cx="13"  cy="-13" r="3.5" fill="#fff" />
        <circle cx="0"   cy="0"   r="3.5" fill="#fff" />
        <circle cx="-13" cy="13"  r="3.5" fill="#fff" />
        <circle cx="13"  cy="13"  r="3.5" fill="#fff" />
      </g>

      {/* Dado azul — face 3 (atrás/à direita) */}
      <g transform="translate(322, 95) rotate(12)" filter="url(#seq-shadow)">
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="url(#seq-blue)" />
        <rect x="-26" y="-26" width="52" height="52" rx="9" fill="none" stroke="#0a1f6e" strokeWidth="1.2" />
        {/* Pintas (face 3) */}
        <circle cx="-12" cy="-12" r="3.5" fill="#fff" />
        <circle cx="0"   cy="0"   r="3.5" fill="#fff" />
        <circle cx="12"  cy="12"  r="3.5" fill="#fff" />
      </g>
    </svg>
  );
}

function TransitionSection({ onContinue }: { onContinue: () => void }) {
  return (
    <Grid id="seq-transition" paddings="pt-xl pb-xl" backgroundColor="bg-linear-(--color-gradient-level-5)">
      <GridItem styles="text-center" cols="col-[3_/_11] max-md:col-[1_/_13]">
        <div className="flex flex-col items-center gap-y-xs">
          <TransitionIllustration />
          <TextBlock
            centralize
            overline="PRIMEIRO OVA CONCLUÍDO"
            title={<h2 className="ds-heading-ultra">Excelente! Você concluiu o Disco Aleatório</h2>}
            paragraph={
              <span className="ds-body">
                Você explorou a probabilidade como limite da frequência relativa em três etapas:
                espaço amostral equiprovável, não equiprovável por área e não equiprovável por
                cores.
                <br /><br />
                Agora vamos para o segundo OVA da sequência: <strong>Dois Dados</strong>. Você vai
                ver que somar duas faces equiprováveis NÃO produz somas equiprováveis — uma
                surpresa que abre caminho para o estudo da união e da interseção de eventos.
              </span>
            }
            maxWidthParagraph="max-w-[640px]"
          />
          <Button style="primary" size="medium" icon={<ArrowRight />} onClick={onContinue}>
            Iniciar OVA: Dois Dados
          </Button>
        </div>
      </GridItem>
    </Grid>
  );
}

// SVG da transição entre OVAs: disco aleatório completado (com selo verde
// de conclusão) + seta apontando para o próximo desafio (dois dados).
function TransitionIllustration() {
  return (
    <svg
      role="img"
      aria-label="Disco aleatório concluído: setores coloridos com selo verde de aprovado e seta indicando o próximo desafio (dois dados)"
      viewBox="0 0 380 160"
      className="w-full max-w-[420px] h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="trans-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
          <feOffset dx="0" dy="3" result="offsetBlur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.25" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="trans-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3ab85a" />
          <stop offset="100%" stopColor="#229900" />
        </linearGradient>
        <linearGradient id="trans-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b5fc7" />
          <stop offset="100%" stopColor="#1a3f9e" />
        </linearGradient>
      </defs>

      {/* Disco aleatório (lado esquerdo) — com selo verde de "concluído" */}
      <g transform="translate(80, 80)" filter="url(#trans-shadow)">
        <path d="M 0 0 L 50 0 A 50 50 0 0 1 25 43.3 Z" fill="#e03b3b" />
        <path d="M 0 0 L 25 43.3 A 50 50 0 0 1 -25 43.3 Z" fill="#1a4a9e" />
        <path d="M 0 0 L -25 43.3 A 50 50 0 0 1 -50 0 Z" fill="#f4c430" />
        <path d="M 0 0 L -50 0 A 50 50 0 0 1 -25 -43.3 Z" fill="#2a8844" />
        <path d="M 0 0 L -25 -43.3 A 50 50 0 0 1 25 -43.3 Z" fill="#7d3c98" />
        <path d="M 0 0 L 25 -43.3 A 50 50 0 0 1 50 0 Z" fill="#e87c1c" />
        <circle cx="0" cy="0" r="50" fill="none" stroke="#2e2e2e" strokeWidth="2.5" />
        <circle cx="0" cy="0" r="6" fill="#2e2e2e" />
        <circle cx="0" cy="0" r="2.5" fill="#fff" />
      </g>

      {/* Selo de conclusão (badge verde com check) sobreposto ao disco */}
      <g transform="translate(120, 50)" filter="url(#trans-shadow)">
        <circle cx="0" cy="0" r="22" fill="url(#trans-green)" stroke="#fff" strokeWidth="3" />
        <path d="M -9 0 L -3 6 L 10 -7" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Seta de transição (indicando próximo desafio) */}
      <g transform="translate(190, 80)" stroke="#1a4a9e" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7">
        <line x1="-25" y1="0" x2="20" y2="0" strokeDasharray="4 3" />
        <polyline points="14,-6 22,0 14,6" />
      </g>

      {/* Próximo desafio: dois dados — discreto, sinalizando o que vem */}
      <g transform="translate(265, 80) rotate(-8)" filter="url(#trans-shadow)" opacity="0.9">
        <rect x="-22" y="-22" width="44" height="44" rx="8" fill="#fff" stroke="#0a1f6e" strokeWidth="1.2" />
        <circle cx="-10" cy="-10" r="3" fill="#1a3f9e" />
        <circle cx="10"  cy="-10" r="3" fill="#1a3f9e" />
        <circle cx="0"   cy="0"   r="3" fill="#1a3f9e" />
        <circle cx="-10" cy="10"  r="3" fill="#1a3f9e" />
        <circle cx="10"  cy="10"  r="3" fill="#1a3f9e" />
      </g>
      <g transform="translate(318, 95) rotate(12)" filter="url(#trans-shadow)" opacity="0.9">
        <rect x="-22" y="-22" width="44" height="44" rx="8" fill="url(#trans-blue)" stroke="#0a1f6e" strokeWidth="1.2" />
        <circle cx="-10" cy="-10" r="3" fill="#fff" />
        <circle cx="0"   cy="0"   r="3" fill="#fff" />
        <circle cx="10"  cy="10"  r="3" fill="#fff" />
      </g>
    </svg>
  );
}

function CompletionSection() {
  return (
    <Grid id="seq-complete" paddings="pt-xl pb-xl" backgroundColor="bg-linear-(--color-gradient-level-5)">
      <GridItem styles="text-center" cols="col-[3_/_11] max-md:col-[1_/_13]">
        <div
          className="flex flex-col items-center gap-y-xs"
          role="status"
          aria-live="polite"
          aria-label="Sequência didática concluída"
        >
          {/* Cena celebrativa: troféu + disco + dados + confetti animado */}
          <div style={{ animation: 'seqSuccessFade 0.6s ease-out 0.1s both' }}>
            <CompletionIllustration />
          </div>
          <div
            className="flex flex-col items-center gap-y-xs"
            style={{ animation: 'seqSuccessFade 0.6s ease-out 0.3s both' }}
          >
            <p
              className="ds-heading-giga text-brand-otimath-pure font-bold flex items-center gap-x-micro flex-wrap justify-center"
              style={{ transformOrigin: 'center', animation: 'seqStarTwinkle 1.8s ease-in-out infinite' }}
            >
              <span aria-hidden="true">🎉</span>
              <span>PARABÉNS!</span>
              <span aria-hidden="true">🎉</span>
            </p>
            <TextBlock
              centralize
              title={<h2 className="ds-heading-ultra">Você concluiu a sequência didática!</h2>}
              paragraph={
                <span className="ds-body">
                  Você percorreu os dois OVAs e construiu uma compreensão sólida da probabilidade —
                  do experimento aleatório com um disco até a sistematização do espaço amostral
                  equiprovável com dois dados.
                  <br /><br />
                  Continue explorando outros recursos do Oti-Math.
                </span>
              }
              maxWidthParagraph="max-w-[640px]"
            />
          </div>

          {/* Estatísticas consolidadas — três cards lado a lado no
              desktop, empilhados no mobile. O card "Total" usa variante
              destacada (`total`) para reforçar visualmente que é o
              agregado da trilha inteira. */}
          <CompletionStats />

          <div className="flex gap-x-micro flex-wrap justify-center">
            <Button type="link" href="/ensino/probabilidade" style="primary" size="medium">
              Ver outras aplicações
            </Button>
            <Button type="link" href="/" style="secondary" size="medium">
              Voltar para o início
            </Button>
          </div>
        </div>
      </GridItem>
      <style>{`
        @keyframes seqSuccessPop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes seqSuccessRing {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes seqSuccessFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes seqConfettiFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateY(120px) rotate(360deg); opacity: 0; }
        }
        @keyframes seqTrophyShine {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
        @keyframes seqStarTwinkle {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50%      { transform: scale(1.25); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes seqSuccessPop  { 0%,100% { transform: scale(1); opacity: 1; } }
          @keyframes seqSuccessRing { 0%,100% { transform: scale(1); opacity: 0; } }
          @keyframes seqSuccessFade { 0%,100% { transform: none; opacity: 1; } }
          @keyframes seqConfettiFall { 0%,100% { transform: none; opacity: 0; } }
          @keyframes seqTrophyShine  { 0%,100% { opacity: 0.6; } }
          @keyframes seqStarTwinkle  { 0%,100% { transform: none; opacity: 1; } }
        }
      `}</style>
    </Grid>
  );
}

// SVG comemorativo da conclusão da sequência: troféu central + disco
// aleatório + dois dados nas laterais + confete caindo + estrelas
// piscando. Anima sutilmente para reforçar a sensação de conquista.
function CompletionIllustration() {
  // Confete: gerado uma vez por mount
  const confetti = Array.from({ length: 14 }, (_, i) => ({
    x: 20 + (i * 28) + (i % 3) * 6,
    color: ['#e03b3b', '#1a4a9e', '#f4c430', '#2a8844', '#7d3c98', '#e87c1c'][i % 6],
    delay: (i * 0.18) % 2.6,
    duration: 1.8 + (i % 3) * 0.35,
    rotate: (i * 47) % 360,
    shape: i % 3,
  }));

  return (
    <svg
      role="img"
      aria-label="Troféu dourado central com selo de aprovação, ladeado pelo disco aleatório e dois dados, confetes coloridos caindo e estrelas piscando"
      viewBox="0 0 420 220"
      className="w-full max-w-[480px] h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="comp-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
          <feOffset dx="0" dy="3" result="offsetBlur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.28" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="comp-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe46b" />
          <stop offset="55%" stopColor="#f4b731" />
          <stop offset="100%" stopColor="#c98a18" />
        </linearGradient>
        <linearGradient id="comp-gold-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4b731" />
          <stop offset="100%" stopColor="#a06b0b" />
        </linearGradient>
        <linearGradient id="comp-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b5fc7" />
          <stop offset="100%" stopColor="#1a3f9e" />
        </linearGradient>
        <radialGradient id="comp-shine" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Confete caindo do topo */}
      {confetti.map((c, i) => (
        <g key={i} style={{ transformOrigin: `${c.x}px 30px`, animation: `seqConfettiFall ${c.duration}s linear ${c.delay}s infinite` }}>
          {c.shape === 0 ? (
            <rect x={c.x - 3} y="20" width="6" height="3" fill={c.color} transform={`rotate(${c.rotate} ${c.x} 22)`} />
          ) : c.shape === 1 ? (
            <circle cx={c.x} cy="22" r="2.5" fill={c.color} />
          ) : (
            <path d={`M ${c.x} 18 L ${c.x + 4} 24 L ${c.x - 4} 24 Z`} fill={c.color} />
          )}
        </g>
      ))}

      {/* Disco aleatório (lado esquerdo) */}
      <g transform="translate(70, 145)" filter="url(#comp-shadow)">
        <path d="M 0 0 L 38 0 A 38 38 0 0 1 19 32.9 Z" fill="#e03b3b" />
        <path d="M 0 0 L 19 32.9 A 38 38 0 0 1 -19 32.9 Z" fill="#1a4a9e" />
        <path d="M 0 0 L -19 32.9 A 38 38 0 0 1 -38 0 Z" fill="#f4c430" />
        <path d="M 0 0 L -38 0 A 38 38 0 0 1 -19 -32.9 Z" fill="#2a8844" />
        <path d="M 0 0 L -19 -32.9 A 38 38 0 0 1 19 -32.9 Z" fill="#7d3c98" />
        <path d="M 0 0 L 19 -32.9 A 38 38 0 0 1 38 0 Z" fill="#e87c1c" />
        <circle cx="0" cy="0" r="38" fill="none" stroke="#2e2e2e" strokeWidth="2" />
        <circle cx="0" cy="0" r="4" fill="#2e2e2e" />
      </g>

      {/* Dois dados (lado direito) */}
      <g transform="translate(335, 130) rotate(-10)" filter="url(#comp-shadow)">
        <rect x="-22" y="-22" width="44" height="44" rx="8" fill="#fff" stroke="#0a1f6e" strokeWidth="1.4" />
        <circle cx="-10" cy="-10" r="3" fill="#1a3f9e" />
        <circle cx="10"  cy="-10" r="3" fill="#1a3f9e" />
        <circle cx="0"   cy="0"   r="3" fill="#1a3f9e" />
        <circle cx="-10" cy="10"  r="3" fill="#1a3f9e" />
        <circle cx="10"  cy="10"  r="3" fill="#1a3f9e" />
      </g>
      <g transform="translate(370, 160) rotate(14)" filter="url(#comp-shadow)">
        <rect x="-20" y="-20" width="40" height="40" rx="7" fill="url(#comp-blue)" stroke="#0a1f6e" strokeWidth="1.2" />
        <circle cx="-9" cy="-9" r="2.8" fill="#fff" />
        <circle cx="0"  cy="0"  r="2.8" fill="#fff" />
        <circle cx="9"  cy="9"  r="2.8" fill="#fff" />
      </g>

      {/* Troféu central */}
      <g transform="translate(210, 110)" filter="url(#comp-shadow)">
        {/* Alças (cabos) */}
        <path d="M -42 -32 C -68 -32 -68 8 -42 8" fill="none" stroke="url(#comp-gold-handle)" strokeWidth="6" strokeLinecap="round" />
        <path d="M  42 -32 C  68 -32  68 8  42 8" fill="none" stroke="url(#comp-gold-handle)" strokeWidth="6" strokeLinecap="round" />
        {/* Copa do troféu */}
        <path d="M -42 -42 L 42 -42 L 38 12 C 38 28 22 36 0 36 C -22 36 -38 28 -38 12 Z" fill="url(#comp-gold)" stroke="#a06b0b" strokeWidth="1.5" />
        {/* Highlight (brilho) */}
        <ellipse cx="-12" cy="-22" rx="14" ry="22" fill="url(#comp-shine)" style={{ animation: 'seqTrophyShine 2.4s ease-in-out infinite' }} />
        {/* Faixa horizontal decorativa */}
        <rect x="-42" y="-12" width="84" height="4" fill="#a06b0b" opacity="0.3" />
        {/* Coluna/haste */}
        <rect x="-6" y="36" width="12" height="14" fill="url(#comp-gold-handle)" />
        {/* Base */}
        <rect x="-30" y="48" width="60" height="6" rx="2" fill="url(#comp-gold-handle)" />
        <rect x="-36" y="54" width="72" height="8" rx="3" fill="#8b5e0a" />
        {/* Estrela central no troféu */}
        <g transform="translate(0, -10)" style={{ transformOrigin: '0 0', animation: 'seqStarTwinkle 1.6s ease-in-out infinite' }}>
          <path
            d="M 0 -16 L 4.7 -4.9 L 16.5 -3.3 L 7.9 5.1 L 10.1 16.7 L 0 11.2 L -10.1 16.7 L -7.9 5.1 L -16.5 -3.3 L -4.7 -4.9 Z"
            fill="#fff"
            stroke="#a06b0b"
            strokeWidth="1.2"
          />
        </g>
      </g>

      {/* Estrelinhas decorativas piscando */}
      <g style={{ transformOrigin: '155px 60px', animation: 'seqStarTwinkle 1.8s ease-in-out 0.2s infinite' }}>
        <path d="M 155 54 L 156.6 58.6 L 161.4 58.9 L 157.7 62 L 158.9 66.7 L 155 64 L 151.1 66.7 L 152.3 62 L 148.6 58.9 L 153.4 58.6 Z" fill="#f4c430" />
      </g>
      <g style={{ transformOrigin: '270px 50px', animation: 'seqStarTwinkle 2.1s ease-in-out 0.6s infinite' }}>
        <path d="M 270 44 L 271.4 48.2 L 275.8 48.4 L 272.4 51.1 L 273.5 55.4 L 270 52.9 L 266.5 55.4 L 267.6 51.1 L 264.2 48.4 L 268.6 48.2 Z" fill="#fbe46b" />
      </g>
      <g style={{ transformOrigin: '305px 90px', animation: 'seqStarTwinkle 1.5s ease-in-out 0.4s infinite' }}>
        <circle cx="305" cy="90" r="3" fill="#f4c430" />
      </g>
      <g style={{ transformOrigin: '125px 95px', animation: 'seqStarTwinkle 2.3s ease-in-out 0.8s infinite' }}>
        <circle cx="125" cy="95" r="3" fill="#fbe46b" />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// CompletionStats — três cards (Disco, Dois Dados, Total) na tela
// final da sequência. Pelo `endSequence()` já ter sido chamado, os
// tempos estão congelados — `useSequenceTick` é dispensável aqui,
// mas mantido por baixo custo e consistência com as outras telas.
// ─────────────────────────────────────────────────────────────────
function CompletionStats() {
  useSequenceTick(1000);
  const { roulette, twoDices, total } = getSequenceStats();
  // Estado: qual OVA tem o modal de revisão aberto agora. Cada OVA tem
  // SEU PRÓPRIO glossário — o do Disco usa exemplos com setores, o do
  // Dois Dados usa pares ordenados (verde × azul).
  const [studyMenuOpen, setStudyMenuOpen] = useState<null | 'roulette' | 'twoDices'>(null);
  return (
    <div className="w-full max-w-[1000px] flex flex-col gap-y-micro">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-micro gap-y-micro">
        <SequenceStatsCard
          title="OVA do Disco"
          stats={roulette}
          footer={
            <Button
              style="borderless"
              size="small"
              icon={<BookOpen />}
              onClick={() => setStudyMenuOpen('roulette')}
            >
              Revisar conceitos
            </Button>
          }
        />
        <SequenceStatsCard
          title="OVA Dois Dados"
          stats={twoDices}
          footer={
            <Button
              style="borderless"
              size="small"
              icon={<BookOpen />}
              onClick={() => setStudyMenuOpen('twoDices')}
            >
              Revisar conceitos
            </Button>
          }
        />
        <SequenceStatsCard title="Total da Trilha" stats={total} variant="total" />
      </div>
      {/* Modal único — alterna glossário conforme qual botão foi
          clicado. Usar duas instâncias separadas seria mais simples,
          mas o StudyMenu é caro de montar (focus management +
          listeners de Esc) — uma instância só, com entries trocadas
          dinamicamente, é mais leve. */}
      <StudyMenu
        open={studyMenuOpen !== null}
        onClose={() => setStudyMenuOpen(null)}
        entries={studyMenuOpen === 'roulette' ? DISCO_GLOSSARY : DOIS_DADOS_GLOSSARY}
        groups={studyMenuOpen === 'roulette' ? DISCO_GROUPS : DOIS_DADOS_GROUPS}
      />
    </div>
  );
}
