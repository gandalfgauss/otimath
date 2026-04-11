'use client'

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/global/Button';
import { playSound } from '@/hooks/global/useSound';
import type { TwoDiceSceneHandle } from './TwoDiceScene';
import { SampleSpaceTree } from './SampleSpaceTree';

// ═══════ Faces do dado com pintas ═══════
const PIP_PATTERNS: Record<number, number[]> = {
  1: [0,0,0, 0,1,0, 0,0,0],
  2: [0,0,1, 0,0,0, 1,0,0],
  3: [0,0,1, 0,1,0, 1,0,0],
  4: [1,0,1, 0,0,0, 1,0,1],
  5: [1,0,1, 0,1,0, 1,0,1],
  6: [1,0,1, 1,0,1, 1,0,1],
};

function DiceFaceIcon({ face, size, color = 'blue' }: { face: number; size: number; color?: 'blue' | 'green' }) {
  const pips = PIP_PATTERNS[face];
  const pipSize = Math.floor(size * 0.22);
  const gap = Math.floor(size * 0.04);
  const bgColor = color === 'green' ? '#1a5c2e' : 'var(--color-brand-otimath-dark)';
  return (
    <div style={{
      width: size, height: size,
      borderRadius: Math.floor(size * 0.16),
      background: bgColor,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(3, 1fr)',
      padding: Math.floor(size * 0.14),
      gap,
    }}>
      {pips.map((pip, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {pip ? <div style={{ width: pipSize, height: pipSize, borderRadius: '50%', background: '#fff' }} /> : null}
        </div>
      ))}
    </div>
  );
}

// ═══════ CSS para piscar ═══════
const blinkStyle = `
@keyframes cellBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
`;

// ═══════ Tipos ═══════
type Phase =
  | 'intro' | 'tree' | 'ready' | 'rolling' | 'landed'
  | 'readGreen' | 'readBlue' | 'markTable' | 'feedback'
  | 'pairQuestion' | 'pairExplain' | 'colorQuestion' | 'colorExplain'
  | 'finished';

const TOTAL_ROUNDS = 5;

// ═══════ Componente Principal ═══════
interface TwoDicesExperimentProps {
  diceSceneRef: React.RefObject<TwoDiceSceneHandle | null>;
  diceContainerRef: React.RefObject<HTMLDivElement | null>;
  onFinished: () => void;
}

export function TwoDicesExperiment({ diceSceneRef, diceContainerRef, onFinished }: Readonly<TwoDicesExperimentProps>) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [greenResult, setGreenResult] = useState(0);
  const [blueResult, setBlueResult] = useState(0);

  // Leitura ativa dos dados
  const [readGreen, setReadGreen] = useState('');
  const [readGreenError, setReadGreenError] = useState(false);
  const [readBlue, setReadBlue] = useState('');
  const [readBlueError, setReadBlueError] = useState(false);

  // Tabela 6×6
  const [tableMarks, setTableMarks] = useState<boolean[][]>(() =>
    Array.from({ length: 6 }, () => Array(6).fill(false))
  );
  const [markError, setMarkError] = useState(false);

  // Histórico de pares
  const [history, setHistory] = useState<{ green: number; blue: number }[]>([]);

  // Pergunta (x,y) vs (y,x)
  const [pairAnswer, setPairAnswer] = useState('');
  const [pairAnswerError, setPairAnswerError] = useState(false);
  // Pergunta dados mesma cor
  const [colorAnswer, setColorAnswer] = useState('');
  const [colorAnswerError, setColorAnswerError] = useState(false);
  // Já mostrou o intervalo pedagógico
  const [pedagogicDone, setPedagogicDone] = useState(false);
  // Piscar
  const [blinkPairs, setBlinkPairs] = useState<{ green: number; blue: number }[]>([]);

  // Guards
  const rolling = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Par para a pergunta pedagógica: pegar um par do histórico onde green !== blue
  const getPairForQuestion = (): { original: { green: number; blue: number }; inverted: { green: number; blue: number } } => {
    for (const h of history) {
      if (h.green !== h.blue) {
        return { original: h, inverted: { green: h.blue, blue: h.green } };
      }
    }
    // Se todos os lançamentos deram green === blue, gerar par aleatório distinto
    const vals = [1, 2, 3, 4, 5, 6];
    const a = vals[Math.floor(Math.random() * 6)];
    let b: number;
    do { b = vals[Math.floor(Math.random() * 6)]; } while (b === a);
    return { original: { green: a, blue: b }, inverted: { green: b, blue: a } };
  };

  // ── Lançar dois dados ──
  const launchDice = useCallback(async () => {
    if (rolling.current) return;
    rolling.current = true;
    setPhase('rolling');

    diceContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 400));

    if (diceSceneRef.current) {
      const result = await diceSceneRef.current.roll();
      setGreenResult(result.green);
      setBlueResult(result.blue);
    }

    setPhase('landed');
    await new Promise(r => setTimeout(r, 1500));

    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    rolling.current = false;

    setReadGreen(''); setReadGreenError(false);
    setReadBlue(''); setReadBlueError(false);
    setMarkError(false);
    setPhase('readGreen');
  }, [diceSceneRef, diceContainerRef]);

  // ── Validações ──
  const validateGreen = () => {
    if (parseInt(readGreen) === greenResult) {
      playSound('/sounds/correct.mp3');
      setPhase('readBlue');
    } else {
      setReadGreenError(true);
      playSound('/sounds/incorrect.mp3');
    }
  };

  const validateBlue = () => {
    if (parseInt(readBlue) === blueResult) {
      playSound('/sounds/correct.mp3');
      setPhase('markTable');
    } else {
      setReadBlueError(true);
      playSound('/sounds/incorrect.mp3');
    }
  };

  const validateTableMark = () => {
    const correctRow = greenResult - 1;
    const correctCol = blueResult - 1;
    let newMarkCorrect = false;
    let newMarkCount = 0;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (tableMarks[r][c]) {
          const isFromHistory = history.some(h => h.green - 1 === r && h.blue - 1 === c);
          if (!isFromHistory) {
            newMarkCount++;
            if (r === correctRow && c === correctCol) newMarkCorrect = true;
          }
        }
      }
    }
    if (newMarkCorrect && newMarkCount === 1) {
      setMarkError(false);
      playSound('/sounds/correct.mp3');
      const newHist = [...history, { green: greenResult, blue: blueResult }];
      setHistory(newHist);
      setPhase('feedback');
    } else {
      setMarkError(true);
      playSound('/sounds/incorrect.mp3');
    }
  };

  // ── Próxima rodada (com intervalo pedagógico após rodada 2) ──
  const nextRound = () => {
    const next = round + 1;
    // Após rodada 2 (index 1), inserir intervalo pedagógico
    if (next === 2 && !pedagogicDone) {
      setPairAnswer('');
      setPairAnswerError(false);
      setColorAnswer('');
      setColorAnswerError(false);
      setPhase('pairQuestion');
      return;
    }
    if (next >= TOTAL_ROUNDS) {
      playSound('/sounds/gameFinished.mp3');
      setPhase('finished');
    } else {
      setRound(next);
      setPhase('ready');
    }
  };

  // ── Após intervalo pedagógico, continuar na rodada 3 ──
  const resumeAfterPedagogic = () => {
    setPedagogicDone(true);
    setBlinkPairs([]);
    setRound(2);
    setPhase('ready');
  };

  // ── Toggle célula ──
  const toggleCell = (row: number, col: number) => {
    if (phase !== 'markTable') return;
    const isFromHistory = history.some(h => h.green - 1 === row && h.blue - 1 === col);
    if (isFromHistory) return;
    const next = tableMarks.map(r => [...r]);
    next[row][col] = !next[row][col];
    setTableMarks(next);
    setMarkError(false);
  };

  // ── Iniciar piscar ──
  useEffect(() => {
    if (phase === 'pairExplain') {
      const pair = getPairForQuestion();
      if (pair) {
        setBlinkPairs([pair.original, pair.inverted]);
      }
    } else if (phase !== 'colorQuestion' && phase !== 'colorExplain') {
      setBlinkPairs([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Tabela 6×6 ──
  const renderTable = (interactive?: boolean) => {
    const isInteractive = interactive ?? phase === 'markTable';
    const showHighlight = phase === 'feedback' || phase === 'finished';

    return (
      <div className="overflow-x-auto">
        <style>{blinkStyle}</style>
        <table className="border-collapse mx-auto" style={{ minWidth: 320 }}>
          <thead>
            <tr>
              <th className="p-micro" style={{ width: 40 }} />
              {[1, 2, 3, 4, 5, 6].map(c => (
                <th key={c} className="p-micro text-center">
                  <DiceFaceIcon face={c} size={36} color="blue" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(r => (
              <tr key={r}>
                <td className="p-micro text-center">
                  <DiceFaceIcon face={r} size={36} color="green" />
                </td>
                {[1, 2, 3, 4, 5, 6].map(c => {
                  const row = r - 1, col = c - 1;
                  const marked = tableMarks[row][col];
                  const isFromHistory = history.some(h => h.green - 1 === row && h.blue - 1 === col);
                  const isCurrentResult = showHighlight && r === greenResult && c === blueResult;
                  const isHighlightRow = showHighlight && r === greenResult && c !== blueResult;
                  const isHighlightCol = showHighlight && c === blueResult && r !== greenResult;
                  const isBlink = blinkPairs.some(p => p.green === r && p.blue === c);

                  let bg = undefined;
                  if (isCurrentResult) bg = 'linear-gradient(180deg, #f1cf75, #c79634)';
                  else if (isBlink) bg = 'linear-gradient(180deg, #f1cf75, #c79634)';
                  else if (isHighlightRow) bg = 'rgba(42, 107, 69, 0.15)';
                  else if (isHighlightCol) bg = 'rgba(36, 80, 190, 0.15)';
                  else if (isFromHistory) bg = 'rgba(199, 165, 74, 0.12)';

                  return (
                    <td
                      key={c}
                      className="border border-neutral-lighter p-micro text-center"
                      style={{
                        background: bg,
                        cursor: isInteractive && !isFromHistory ? 'pointer' : 'default',
                        transition: isBlink ? 'none' : 'background 0.2s',
                        animation: isBlink ? 'cellBlink 0.8s ease-in-out infinite' : undefined,
                        minWidth: 44, minHeight: 44,
                      }}
                      onClick={() => isInteractive && toggleCell(row, col)}
                    >
                      <div className="flex flex-col items-center gap-y-nano">
                        <span className="ds-caption text-neutral-dark" style={{
                          fontWeight: (isCurrentResult || isBlink) ? 700 : 400,
                          color: (isCurrentResult || isBlink) ? '#1a1205' : undefined,
                        }}>
                          ({r},{c})
                        </span>
                        {(isFromHistory || marked) && (
                          <input
                            type="checkbox"
                            checked={marked}
                            disabled={!isInteractive || isFromHistory}
                            onChange={() => isInteractive && toggleCell(row, col)}
                            style={{ width: 18, height: 18, accentColor: isFromHistory ? 'var(--color-brand-otimath-pure)' : 'var(--color-feedback-success-dark)' }}
                          />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ═══════ RENDER ═══════
  return (
    <div className="w-full max-w-[700px]">
      <h2 className="ds-heading-ultra text-brand-otimath-dark text-center mb-xs">
        Lançamento de dois dados
      </h2>

      {/* ═══════ INTRO — costura narrativa após a Cena 6 (máquina automática) ═══════
          Reordenamento didático: o aluno chega aqui já tendo observado o
          fenômeno na máquina, registrado pares, somado e feito uma previsão.
          A tabela é a RESPOSTA à pergunta plantada na ponte da Cena 6
          ("será que é só acaso ou existe um padrão escondido?"). */}
      {phase === 'intro' && (
        <div ref={cardRef} className="rounded-lg p-xxs"
          style={{
            background:
              'linear-gradient(180deg, var(--color-brand-otimath-lightest) 0%, var(--color-neutral-white) 100%)',
            border: '2px solid var(--color-brand-otimath-light)',
            boxShadow: '0 4px 16px rgba(36, 80, 190, 0.10)',
          }}>
          <p className="ds-heading-extra text-brand-otimath-dark text-center mb-micro">
            Quantos pares podem sair?
          </p>
          <p className="ds-body text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Você observou a máquina, registrou pares, somou e fez uma previsão. Mas{' '}
            <strong>quantos pares diferentes podem sair</strong> no lançamento de dois dados?
          </p>
          <p className="ds-body text-neutral-black mb-macro" style={{ textAlign: 'justify' }}>
            Vamos descobrir juntos, construindo as possibilidades <strong>um resultado de cada vez</strong>.
          </p>
          <div className="flex justify-center">
            <Button
              style="primary"
              size="small"
              onClick={() => { setPhase('tree'); playSound('/sounds/nextChallenge.mp3'); }}
              aria-label="Começar a construção do espaço amostral"
            >
              Começar
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ ÁRVORE PROGRESSIVA — construção do espaço amostral ═══════ */}
      {phase === 'tree' && (
        <SampleSpaceTree onFinished={() => setPhase('ready')} diceSceneRef={diceSceneRef} />
      )}

      {/* ═══════ RODADA ATIVA ═══════ */}
      {phase !== 'intro' && phase !== 'tree' && phase !== 'finished' && phase !== 'pairQuestion' && phase !== 'pairExplain' && phase !== 'colorQuestion' && phase !== 'colorExplain' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* Indicador de rodada */}
          <div className="flex justify-center gap-x-micro mb-macro">
            {Array.from({ length: TOTAL_ROUNDS }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-y-nano">
                <div className="rounded-full" style={{
                  width: 14, height: 14,
                  background: i < round ? 'var(--color-feedback-success-dark)'
                    : i === round ? 'var(--color-brand-otimath-pure)'
                    : 'var(--color-neutral-lighter)',
                  transition: 'background 0.3s',
                }} />
                <span className="ds-caption text-neutral-dark">{i + 1}</span>
              </div>
            ))}
          </div>

          <p className="ds-body-bold text-center mb-micro" style={{ color: 'var(--color-brand-otimath-pure)' }}>
            Lançamento {round + 1} de {TOTAL_ROUNDS}
          </p>

          {/* Botão lançar */}
          {phase === 'ready' && (
            <>
              {round === 0 && (
                <p className="ds-body text-neutral-black text-center mb-micro" style={{ textAlign: 'justify' }}>
                  Agora vamos organizar os 36 pares numa <strong>tabela 6×6</strong>.
                  A cada lançamento, leia o resultado dos dados{' '}
                  <strong style={{ color: '#1a5c2e' }}>verde</strong> (linhas) e{' '}
                  <strong style={{ color: 'var(--color-brand-otimath-pure)' }}>azul</strong> (colunas)
                  e marque o par na célula correspondente.
                </p>
              )}
              <div className="flex justify-center mb-micro">
                <Button style="primary" size="small" onClick={launchDice}>
                  🎲 Lançar dois dados
                </Button>
              </div>
            </>
          )}

          {/* Lançando / Observe */}
          {(phase === 'rolling' || phase === 'landed') && (
            <p className="ds-body-bold text-neutral-dark text-center mb-micro">
              {phase === 'rolling' ? 'Lançando os dados...' : 'Observe o resultado nos dados.'}
            </p>
          )}

          {/* Leitura do dado verde */}
          {phase === 'readGreen' && (
            <div className="flex flex-col gap-y-micro items-center mb-micro">
              <p className="ds-body-bold text-neutral-black text-center">
                Qual foi o resultado do dado <strong style={{ color: 'var(--color-feedback-success-dark)' }}>verde</strong>?
              </p>
              <div className="flex items-center gap-x-micro">
                <select value={readGreen} onChange={e => { setReadGreen(e.target.value); setReadGreenError(false); }}
                  className="ds-body-bold"
                  style={{ border: `2px solid ${readGreenError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`, borderRadius: 8, padding: '6px 12px', outline: 'none', textAlign: 'center', minWidth: 64 }}>
                  <option value="">?</option>
                  {[1,2,3,4,5,6].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <Button style="primary" size="extra-small" onClick={validateGreen}>Conferir</Button>
              </div>
              {readGreenError && (
                <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Veja o resultado na face superior do dado verde e tente novamente.
                </p>
              )}
            </div>
          )}

          {/* Leitura do dado azul */}
          {phase === 'readBlue' && (
            <div className="flex flex-col gap-y-micro items-center mb-micro">
              <div className="flex flex-col items-center mb-nano">
                <span className="ds-caption-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>Dado verde</span>
                <DiceFaceIcon face={greenResult} size={40} color="green" />
              </div>
              <p className="ds-body-bold text-neutral-black text-center">
                Qual foi o resultado do dado <strong style={{ color: 'var(--color-brand-otimath-pure)' }}>azul</strong>?
              </p>
              <div className="flex items-center gap-x-micro">
                <select value={readBlue} onChange={e => { setReadBlue(e.target.value); setReadBlueError(false); }}
                  className="ds-body-bold"
                  style={{ border: `2px solid ${readBlueError ? 'var(--color-feedback-error-dark)' : 'var(--color-neutral-lighter)'}`, borderRadius: 8, padding: '6px 12px', outline: 'none', textAlign: 'center', minWidth: 64 }}>
                  <option value="">?</option>
                  {[1,2,3,4,5,6].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <Button style="primary" size="extra-small" onClick={validateBlue}>Conferir</Button>
              </div>
              {readBlueError && (
                <p className="ds-small-bold" style={{ color: 'var(--color-feedback-error-dark)' }}>
                  Veja o resultado na face superior do dado azul e tente novamente.
                </p>
              )}
            </div>
          )}

          {/* Marcar na tabela */}
          {phase === 'markTable' && (
            <div className="flex flex-col gap-y-micro">
              <div className="flex gap-x-xs items-center justify-center mb-micro">
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>Verde</span>
                  <DiceFaceIcon face={greenResult} size={40} color="green" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-brand-otimath-pure)' }}>Azul</span>
                  <DiceFaceIcon face={blueResult} size={40} color="blue" />
                </div>
              </div>
              <p className="ds-body-bold text-neutral-black text-center mb-micro">
                Marque o par ordenado <strong>({greenResult}, {blueResult})</strong> na tabela:
              </p>
              {renderTable()}
              <div className="flex flex-col items-center gap-y-micro mt-micro">
                <Button style="primary" size="extra-small" onClick={validateTableMark}>Conferir</Button>
                {markError && (
                  <p className="ds-small-bold text-center" style={{ color: 'var(--color-feedback-error-dark)' }}>
                    Marque apenas a célula correspondente ao par ordenado ({greenResult}, {blueResult}).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Feedback */}
          {phase === 'feedback' && (
            <div className="flex flex-col gap-y-micro">
              <div className="flex gap-x-xs items-center justify-center mb-micro">
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-feedback-success-dark)' }}>Verde</span>
                  <DiceFaceIcon face={greenResult} size={40} color="green" />
                  <span className="ds-body-bold text-neutral-black">{greenResult}</span>
                </div>
                <span className="ds-heading-large text-neutral-dark">→</span>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold text-brand-otimath-pure">Par ordenado</span>
                  <span className="ds-heading-large text-brand-otimath-dark">({greenResult}, {blueResult})</span>
                </div>
                <span className="ds-heading-large text-neutral-dark">←</span>
                <div className="flex flex-col items-center">
                  <span className="ds-caption-bold" style={{ color: 'var(--color-brand-otimath-pure)' }}>Azul</span>
                  <DiceFaceIcon face={blueResult} size={40} color="blue" />
                  <span className="ds-body-bold text-neutral-black">{blueResult}</span>
                </div>
              </div>
              {renderTable()}
              <p className="ds-small text-neutral-dark text-center mt-micro" style={{ fontStyle: 'italic' }}>
                Lançamentos registrados: {history.length} de {TOTAL_ROUNDS}.
              </p>
              <div className="flex justify-center mt-micro">
                <Button style="primary" size="small" onClick={nextRound}>
                  {round + 1 >= TOTAL_ROUNDS ? 'Próximo: finalizar' : `Próximo: lançamento ${round + 2} de ${TOTAL_ROUNDS}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ INTERVALO PEDAGÓGICO: (x,y) vs (y,x) ═══════ */}
      {phase === 'pairQuestion' && (() => {
        const pair = getPairForQuestion();
        if (!pair) { setPhase('pairExplain'); return null; }
        const { original: o } = pair;
        return (
          <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="ds-body-bold text-neutral-black text-center mb-micro" style={{ fontSize: '1.05rem' }}>
              Considere o par ordenado <strong>({o.green}, {o.blue})</strong> que você registrou.
            </p>
            <p className="ds-body-bold text-neutral-black text-center mb-micro">
              O par <strong>({o.green}, {o.blue})</strong> é o mesmo que <strong>({o.blue}, {o.green})</strong>?
            </p>
            <div className="flex justify-center gap-x-macro mb-micro">
              <Button
                style={pairAnswer === 'sim' ? 'primary' : 'secondary'}
                size="extra-small"
                onClick={() => { setPairAnswer('sim'); setPairAnswerError(false); }}
              >
                Sim, são iguais
              </Button>
              <Button
                style={pairAnswer === 'nao' ? 'primary' : 'secondary'}
                size="extra-small"
                onClick={() => { setPairAnswer('nao'); setPairAnswerError(false); }}
              >
                Não, são diferentes
              </Button>
            </div>
            {pairAnswer && (
              <div className="flex justify-center">
                <Button style="primary" size="small" onClick={() => {
                  if (pairAnswer === 'nao') {
                    playSound('/sounds/correct.mp3');
                    setPhase('pairExplain');
                  } else {
                    playSound('/sounds/incorrect.mp3');
                    setPairAnswerError(true);
                  }
                }}>Conferir</Button>
              </div>
            )}
            {pairAnswerError && (
              <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
                Observe a posição de cada resultado na tabela. Tente novamente.
              </p>
            )}
          </div>
        );
      })()}

      {phase === 'pairExplain' && (() => {
        const pair = getPairForQuestion();
        const o = pair?.original ?? { green: 3, blue: 5 };
        return (
          <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify', fontSize: '1.05rem' }}>
              Os pares <strong>({o.green}, {o.blue})</strong> e <strong>({o.blue}, {o.green})</strong> são
              resultados <strong>diferentes</strong>.
            </p>
            <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
              Em <strong>({o.green}, {o.blue})</strong>, o dado
              <strong style={{ color: 'var(--color-feedback-success-dark)' }}> verde</strong> saiu {o.green} e o dado
              <strong style={{ color: 'var(--color-brand-otimath-pure)' }}> azul</strong> saiu {o.blue}.
              Em <strong>({o.blue}, {o.green})</strong>, o dado
              <strong style={{ color: 'var(--color-feedback-success-dark)' }}> verde</strong> saiu {o.blue} e o dado
              <strong style={{ color: 'var(--color-brand-otimath-pure)' }}> azul</strong> saiu {o.green}.
              São posições diferentes na tabela:
            </p>
            {renderTable(false)}
            <div className="flex justify-center mt-micro">
              <Button style="primary" size="small" onClick={() => setPhase('colorQuestion')}>
                Próximo
              </Button>
            </div>
          </div>
        );
      })()}

      {/* ═══════ PERGUNTA SOBRE DADOS DA MESMA COR ═══════ */}
      {phase === 'colorQuestion' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black text-center mb-micro" style={{ fontSize: '1.05rem' }}>
            E se os dois dados fossem da <strong>mesma cor</strong>? Ainda seria possível distinguir os pares?
          </p>
          <div className="flex justify-center gap-x-macro mb-micro">
            <Button
              style={colorAnswer === 'sim' ? 'primary' : 'secondary'}
              size="extra-small"
              onClick={() => { setColorAnswer('sim'); setColorAnswerError(false); }}
            >
              Sim
            </Button>
            <Button
              style={colorAnswer === 'nao' ? 'primary' : 'secondary'}
              size="extra-small"
              onClick={() => { setColorAnswer('nao'); setColorAnswerError(false); }}
            >
              Não
            </Button>
          </div>
          {colorAnswer && (
            <div className="flex justify-center">
              <Button style="primary" size="small" onClick={() => {
                if (colorAnswer === 'sim') {
                  playSound('/sounds/correct.mp3');
                  setPhase('colorExplain');
                } else {
                  playSound('/sounds/incorrect.mp3');
                  setColorAnswerError(true);
                }
              }}>Conferir</Button>
            </div>
          )}
          {colorAnswerError && (
            <p className="ds-small-bold text-center mt-micro" style={{ color: 'var(--color-feedback-error-dark)' }}>
              Lembre-se: os dois dados são objetos separados, mesmo que tenham a mesma cor. Tente novamente.
            </p>
          )}
        </div>
      )}

      {phase === 'colorExplain' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify', fontSize: '1.05rem' }}>
            Mesmo que os dados fossem da mesma cor, eles continuam sendo dois objetos separados.
            Cada dado produz seu próprio resultado, e a <strong>ordem importa</strong>.
          </p>
          <p className="ds-body-bold text-neutral-black mb-micro" style={{ textAlign: 'justify' }}>
            Usamos cores diferentes para <strong>facilitar a identificação</strong> de qual dado
            corresponde à linha e qual corresponde à coluna na tabela.
          </p>
          <div className="flex justify-center mt-micro">
            <Button style="primary" size="small" onClick={resumeAfterPedagogic}>
              Próximo: lançamento 3 de {TOTAL_ROUNDS}
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ FINALIZAÇÃO ═══════ */}
      {phase === 'finished' && (
        <div ref={cardRef} className="bg-neutral-white rounded-lg p-xxs border border-neutral-lighter"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <p className="ds-body-bold text-neutral-black mb-micro" style={{ fontSize: '1.05rem', textAlign: 'justify' }}>
            Você realizou {TOTAL_ROUNDS} lançamentos e registrou os resultados como pares ordenados na tabela.
            Cada célula representa um resultado possível do experimento aleatório de lançar dois dados.
          </p>
          {renderTable(false)}
          <p className="ds-small text-neutral-dark text-center mt-micro" style={{ fontStyle: 'italic' }}>
            Pares registrados: {history.map(h => `(${h.green}, ${h.blue})`).join(', ')}.
          </p>
          <div className="flex justify-center mt-macro">
            <Button style="primary" size="small" onClick={onFinished}>
              Iniciar Simulação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
