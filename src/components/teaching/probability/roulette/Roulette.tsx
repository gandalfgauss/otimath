'use client'

import { useEffect, useRef, useState } from 'react';

export interface RouletteSector {
  color: string;
  colorName: string;
  angle: number;
  number?: number;
}

interface RouletteProps {
  sectors: RouletteSector[];
  isSpinning: boolean;
  spinDuration: number;
  targetAngle: number;
  showAngles?: boolean;
  showNumbers?: boolean;
  size?: number;
  onSpinEnd?: () => void;
  useTransition?: boolean; // Para giros automáticos rápidos
  // Props para seleção de setores (exercício dinâmico)
  selectableMode?: boolean; // Habilita modo de seleção
  selectedSectors?: number[]; // Índices dos setores selecionados (grupo A - dourado)
  selectedSectorsB?: number[]; // Índices dos setores selecionados (grupo B - ciano)
  highlightGroups?: Array<{indices: number[], color: string}>; // Múltiplos grupos de destaque colorido
  onSectorClick?: (index: number) => void; // Callback ao clicar em um setor
  highlightSelected?: boolean; // Apenas destacar setores selecionados (sem permitir clique)
  largeNumbers?: boolean; // Números maiores e mais visíveis (Etapa 3)
}

const ROULETTE_COLORS: { [key: string]: string } = {
  'Vermelho': '#e03b3b',
  'Azul': '#1a4a9e',
  'Verde': '#2ac000',
  'Amarelo': '#ffa500',
  'Roxo': '#8a2a8a',
  'Rosa': '#e85c9e',
  'Laranja': '#ff6b35',
  'Ciano': '#00bcd4',
  'Marrom': '#8b4513',
  'Cinza': '#6c6c6c',
};

export function Roulette({
  sectors,
  isSpinning,
  spinDuration,
  targetAngle,
  showAngles = false,
  showNumbers = false,
  size = 300,
  onSpinEnd,
  useTransition = false,
  selectableMode = false,
  selectedSectors = [],
  selectedSectorsB = [],
  highlightGroups = [],
  onSectorClick,
  highlightSelected = false,
  largeNumbers = false
}: RouletteProps) {
  const [currentRotation, setCurrentRotation] = useState(0);
  const wheelRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startRotationRef = useRef<number>(0);

  useEffect(() => {
    if (useTransition) {
      // Para giros automáticos, usar CSS transition diretamente
      setCurrentRotation(targetAngle);
      return;
    }

    if (isSpinning && targetAngle !== currentRotation) {
      startRotationRef.current = currentRotation;
      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / spinDuration, 1);

        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);

        const totalRotation = targetAngle - startRotationRef.current;
        const newRotation = startRotationRef.current + (totalRotation * easeOut);

        setCurrentRotation(newRotation);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentRotation(targetAngle);
          onSpinEnd?.();
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isSpinning, targetAngle, spinDuration, onSpinEnd, useTransition]);

  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;

  // Calculate sector paths
  const getSectorPath = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = (endAngle - startAngle) > 180 ? 1 : 0;

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // Calculate text position for sector label
  const getTextPosition = (startAngle: number, endAngle: number, radiusOffset: number = 0.6) => {
    const midAngle = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180;
    const textRadius = radius * radiusOffset;
    return {
      x: centerX + textRadius * Math.cos(midAngle),
      y: centerY + textRadius * Math.sin(midAngle),
      rotation: (startAngle + endAngle) / 2
    };
  };

  // Gerar descrição acessível dos setores
  const sectorDescription = sectors.map(s => `${s.colorName}: ${s.angle}°`).join(', ');

  let currentAngle = 0;

  return (
    <div
      className="relative flex items-center justify-center w-full"
      style={{ maxWidth: size, aspectRatio: '1 / 1' }}
    >
      {/* Pointer */}
      <div
        className="absolute z-10"
        style={{
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        aria-hidden="true"
      >
        <svg width="24" height="30" viewBox="0 0 24 30">
          <polygon
            points="12,30 0,0 24,0"
            fill="#1a4a9e"
            stroke="#0a0f24"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Wheel */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Disco com ${sectors.length} setores: ${sectorDescription}`}
      >
        <g
          ref={wheelRef}
          style={{
            transform: `rotate(${currentRotation}deg)`,
            transformOrigin: 'center',
            transition: useTransition ? `transform ${spinDuration}ms linear` : 'none',
          }}
        >
          {sectors.map((sector, index) => {
            const startAngle = currentAngle;
            const endAngle = currentAngle + sector.angle;
            currentAngle = endAngle;

            const path = getSectorPath(startAngle, endAngle);
            const textPos = getTextPosition(startAngle, endAngle, 0.65);
            const angleTextPos = getTextPosition(startAngle, endAngle, 0.35);

            const colorHex = ROULETTE_COLORS[sector.colorName] || sector.color;

            // Calculate if text should be light or dark based on background
            const isLightBackground = ['Amarelo', 'Rosa', 'Ciano'].includes(sector.colorName);
            const textColor = isLightBackground ? '#2e2e2e' : '#ffffff';

            // Auto-flip text when upside down (considering wheel rotation)
            const midAngle = (startAngle + endAngle) / 2;
            const effectiveAngle = ((midAngle + currentRotation) % 360 + 360) % 360;
            const isUpsideDown = effectiveAngle > 90 && effectiveAngle < 270;
            const nameRotation = isUpsideDown ? textPos.rotation + 180 : textPos.rotation;
            const angleRotation = isUpsideDown ? angleTextPos.rotation + 180 : angleTextPos.rotation;

            // Verificar se o setor está selecionado (modo de seleção ou highlight)
            const isSelectedA = (selectableMode || highlightSelected) && selectedSectors.includes(index);
            const isSelectedB = (selectableMode || highlightSelected) && selectedSectorsB.includes(index);

            // Verificar múltiplos grupos de destaque
            let multiGroupColor: string | null = null;
            if (highlightGroups.length > 0 && (selectableMode || highlightSelected)) {
              for (const group of highlightGroups) {
                if (group.indices.includes(index)) {
                  multiGroupColor = group.color;
                  break;
                }
              }
            }

            const isSelected = isSelectedA || isSelectedB || multiGroupColor !== null;
            const highlightColor = multiGroupColor ?? (isSelectedB ? '#00E5FF' : '#FFD700');

            return (
              <g
                key={index}
                onClick={() => selectableMode && onSectorClick?.(index)}
                onKeyDown={(e) => {
                  if (selectableMode && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSectorClick?.(index);
                  }
                }}
                style={{ cursor: selectableMode ? 'pointer' : 'default', outline: 'none' }}
                role={selectableMode ? 'button' : undefined}
                tabIndex={selectableMode ? 0 : undefined}
                aria-label={selectableMode ? `Setor ${sector.colorName}${sector.number !== undefined ? ` (${sector.number})` : ''} - ${sector.angle}°${isSelected ? ' (selecionado)' : ''}` : undefined}
                aria-pressed={selectableMode ? isSelected : undefined}
              >
                <path
                  d={path}
                  fill={colorHex}
                  stroke={isSelected ? highlightColor : '#2e2e2e'}
                  strokeWidth={isSelected ? '6' : '2'}
                  style={{
                    filter: isSelected ? `brightness(1.2) drop-shadow(0 0 8px ${highlightColor})` : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
                {/* Color name and/or number */}
                {showNumbers && sector.number !== undefined ? (
                  // Mostrar nome da cor E número (formato: Nome\n(número))
                  <g transform={`rotate(${nameRotation}, ${textPos.x}, ${textPos.y})`}>
                    <text
                      x={textPos.x}
                      y={textPos.y - (largeNumbers ? 9 : 6)}
                      fill={textColor}
                      fontSize={largeNumbers
                        ? (sector.angle > 50 ? "13" : sector.angle > 35 ? "11" : "9")
                        : (sector.angle > 50 ? "11" : sector.angle > 35 ? "9" : "7")
                      }
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      aria-hidden="true"
                    >
                      {sector.colorName}
                    </text>
                    <text
                      x={textPos.x}
                      y={textPos.y + (largeNumbers ? 10 : 8)}
                      fill={textColor}
                      fontSize={largeNumbers
                        ? (sector.angle > 50 ? "14" : sector.angle > 35 ? "13" : "10")
                        : (sector.angle > 50 ? "10" : sector.angle > 35 ? "8" : "6")
                      }
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      aria-hidden="true"
                    >
                      ({sector.number})
                    </text>
                  </g>
                ) : (
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    fill={textColor}
                    fontSize={sector.angle > 50 ? "12" : sector.angle > 35 ? "10" : "8"}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${nameRotation}, ${textPos.x}, ${textPos.y})`}
                    aria-hidden="true"
                  >
                    {sector.colorName}
                  </text>
                )}
                {/* Angle display */}
                {showAngles && (
                  <text
                    x={angleTextPos.x}
                    y={angleTextPos.y}
                    fill={textColor}
                    fontSize={sector.angle > 30 ? "10" : "8"}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${angleRotation}, ${angleTextPos.x}, ${angleTextPos.y})`}
                    aria-hidden="true"
                  >
                    {sector.angle}°
                  </text>
                )}
              </g>
            );
          })}
          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * 0.12}
            fill="#1a4a9e"
            stroke="#0a0f24"
            strokeWidth="2"
            aria-hidden="true"
          />
        </g>
      </svg>
    </div>
  );
}

export { ROULETTE_COLORS };
