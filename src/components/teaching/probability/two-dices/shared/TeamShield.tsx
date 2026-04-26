'use client';

/* ═══════════════════════════════════════════════════════════════
   TeamShield — Escudo de time renderizado a partir do PNG real
   extraído do OVA Probabilidade Roxa (Flash legado).

   Estratégia de renderização (por prioridade):
     1. Se `team.img` existir → <img src> simples, com object-fit: contain
     2. Se `team.sprite` existir → <div> com background-image e
        background-position calculadas para recortar o sprite
     3. Caso contrário → fallback SVG estilizado (sigla + cores)

   Tamanho controlado por prop `size` (lado do quadrado, em px).
   Default 64. Em layouts responsivos, recomenda-se passar size
   derivado de clamp() no container pai.

   O caso 2 (sprite) usa CSS background com escala proporcional:
   se o recorte original tem (w × h) e o quadrado de exibição é
   (size × size), background-size é multiplicado pela razão correta
   para que o recorte caiba dentro do quadrado preservando proporção.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import type { Team, SpriteRect } from './teamsData';

interface TeamShieldProps {
  team: Team;
  size?: number;
  showName?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function TeamShield({
  team, size = 64, showName = false, className, ariaLabel,
}: TeamShieldProps) {
  const label = ariaLabel ?? `Escudo do ${team.name}`;
  const [imgError, setImgError] = useState(false);
  const useImg = team.img && !imgError;
  const useSprite = !useImg && team.sprite;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: showName ? 4 : 0,
      }}
    >
      {useImg ? (
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src={team.img}
            alt={label}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            style={{
              width: size,
              height: size,
              objectFit: 'contain',
              transform: team.imgScale ? `scale(${team.imgScale})` : 'none',
              transformOrigin: 'center',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
            }}
          />
        </div>
      ) : useSprite && team.sprite ? (
        <SpriteShield sprite={team.sprite} size={size} ariaLabel={label} />
      ) : (
        <FallbackSvgShield team={team} size={size} ariaLabel={label} />
      )}

      {showName && (
        <span
          className="ds-small-bold"
          style={{
            color: 'var(--color-neutral-darkest)',
            textAlign: 'center',
            maxWidth: size * 1.4,
            lineHeight: 1.1,
          }}
        >
          {team.shortName}
        </span>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Recorte de sprite-sheet via SVG com viewBox — método à prova de
// escalas: o navegador renderiza APENAS a janela [x, y, w, h] do
// sprite original; pixels fora dessa janela são fisicamente
// inacessíveis (não há como vazar conteúdo do escudo vizinho).
// Usado para América-RN, Corinthians, Vasco e Grêmio (`_sprite_4.png`).
// ══════════════════════════════════════════════════════════════════
function SpriteShield({
  sprite, size, ariaLabel,
}: {
  sprite: SpriteRect;
  size: number;
  ariaLabel: string;
}) {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={size}
      height={size}
      viewBox={`${sprite.x} ${sprite.y} ${sprite.w} ${sprite.h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: 'block',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
      }}
    >
      <image
        href={sprite.src}
        x={0}
        y={0}
        width={sprite.spriteW}
        height={sprite.spriteH}
      />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// Fallback SVG estilizado (apenas se a imagem PNG falhar ao carregar)
// ══════════════════════════════════════════════════════════════════
function FallbackSvgShield({
  team, size, ariaLabel,
}: {
  team: Team;
  size: number;
  ariaLabel: string;
}) {
  const id = `shield-fb-${team.id}-${size}`;
  return (
    <svg
      viewBox="0 0 100 110"
      width={size}
      height={Math.round(size * 1.1)}
      role="img"
      aria-label={ariaLabel}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
    >
      <defs>
        <linearGradient id={`${id}-field`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={team.primary} stopOpacity="1" />
          <stop offset="100%" stopColor={team.primary} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M50 4 L92 18 L92 60 Q92 84 50 104 Q8 84 8 60 L8 18 Z"
        fill={`url(#${id}-field)`}
        stroke={team.outline}
        strokeWidth="2"
      />
      <rect x="14" y="46" width="72" height="18" fill={team.secondary} opacity="0.92" />
      <text
        x="50" y="61"
        textAnchor="middle"
        fontFamily="Arial Black, Impact, sans-serif"
        fontSize="16"
        fontWeight="900"
        fill={team.primary === '#ffffff' ? '#000000' : team.textColor}
        letterSpacing="1"
      >
        {team.abbr}
      </text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
// Cabeçalho "Time1 × Time2" (cenografia do Roxa) com tokens OtiMath
// ══════════════════════════════════════════════════════════════════
export function TeamsVersusHeader({
  team1, team2, size = 88,
}: {
  team1: Team;
  team2: Team;
  size?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(12px, 4vw, 32px)',
        flexWrap: 'wrap',
      }}
      aria-label={`Confronto entre ${team1.name} e ${team2.name}`}
    >
      <TeamShield team={team1} size={size} showName />
      <span
        aria-hidden="true"
        style={{
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: 900,
          color: 'var(--color-feedback-error-dark)',
          textShadow: '2px 2px 0 var(--color-neutral-darkest)',
          lineHeight: 1,
        }}
      >
        ×
      </span>
      <TeamShield team={team2} size={size} showName />
    </div>
  );
}
