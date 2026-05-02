/* ═══════════════════════════════════════════════════════════════
   teamsData.ts — Lista de times brasileiros sorteáveis para o
   Exercício 5 (tabela de contingência social).

   Excluídos Atlético Mineiro e Cruzeiro (uso exclusivo do Ex4),
   restando 18 times. Cada item carrega o caminho público para
   o escudo PNG real (extraído do OVA Roxa legado).

   Quatro escudos vêm de um SPRITE comum (`_sprite_4.png`,
   470×470) com 4 escudos lado a lado: América-RN, Corinthians,
   Vasco e Grêmio. Para esses, `sprite` define a janela do
   recorte; o componente TeamShield aplica CSS background-position.
   ═══════════════════════════════════════════════════════════════ */

export type TeamId =
  | 'athletico_pr' | 'atletico_mg' | 'avai' | 'botafogo' | 'coritiba'
  | 'cruzeiro' | 'flamengo' | 'fluminense' | 'goias' | 'inter'
  | 'nautico' | 'palmeiras' | 'santos' | 'sao_paulo' | 'sport'
  | 'vitoria' | 'america_rn' | 'corinthians' | 'vasco' | 'gremio';

/** Recorte dentro do sprite-sheet (em pixels da imagem natural). */
export interface SpriteRect {
  src: string;
  /** Tamanho natural do sprite-sheet inteiro. */
  spriteW: number;
  spriteH: number;
  /** Coordenadas e tamanho do recorte do escudo dentro do sprite. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Team {
  id: TeamId;
  /** Nome oficial completo. */
  name: string;
  /** Nome curto (cabeçalhos da tabela). */
  shortName: string;
  /** Sigla 3 letras (fallback do escudo, se imagem falhar). */
  abbr: string;
  /** Cor primária institucional (fallback do escudo SVG). */
  primary: string;
  /** Cor secundária institucional. */
  secondary: string;
  /** Cor da moldura externa do fallback SVG. */
  outline: string;
  /** Cor do texto da sigla no fallback SVG. */
  textColor: string;
  /** Caminho público do PNG individual (preferido). */
  img?: string;
  /** Recorte dentro de sprite-sheet (4 times do _sprite_4.png). */
  sprite?: SpriteRect;
  /** Fator de escala visual aplicado ao escudo na renderização.
   *  Compensa escudos com moldura externa espessa (redondos cromados)
   *  que de outra forma pareceriam menores que escudos heráldicos.
   *  Default 1.0. Use 1.15–1.25 para escudos circulares com moldura. */
  imgScale?: number;
}

export const TEAMS: Team[] = [
  // Calibração matemática (rev. 4): após trim de transparência,
  // imgScale ≈ sqrt(1/aspect_ratio) iguala área visual, compensando
  // a diferença entre escudos quadrados (preenchem o quadrado) e
  // escudos heráldicos estreitos (deixam laterais vazias).
  {
    id: 'athletico_pr',  name: 'Athletico Paranaense',  shortName: 'Athletico-PR', abbr: 'CAP',
    primary: '#d20000', secondary: '#000000', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/athletico_pr.png',
    imgScale: 1.00, // 197×196 ~ quadrado
  },
  {
    id: 'atletico_mg',   name: 'Atlético Mineiro',      shortName: 'Atlético-MG',  abbr: 'CAM',
    primary: '#000000', secondary: '#ffffff', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/atletico_mg.png',
    imgScale: 1.06, // 172×193 levemente alto
  },
  {
    id: 'avai',          name: 'Avaí',                  shortName: 'Avaí',         abbr: 'AVA',
    primary: '#0a3da8', secondary: '#ffffff', outline: '#0a3da8', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/avai.png',
    imgScale: 1.13, // 134×171 estreito
  },
  {
    id: 'botafogo',      name: 'Botafogo',              shortName: 'Botafogo',     abbr: 'BOT',
    primary: '#000000', secondary: '#ffffff', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/botafogo.png',
    imgScale: 1.06, // 180×202
  },
  {
    id: 'coritiba',      name: 'Coritiba',              shortName: 'Coritiba',     abbr: 'CFC',
    primary: '#00563f', secondary: '#ffffff', outline: '#00563f', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/coritiba.png',
    imgScale: 1.00, // 177×178 ~ quadrado
  },
  {
    id: 'cruzeiro',      name: 'Cruzeiro',              shortName: 'Cruzeiro',     abbr: 'CEC',
    primary: '#0a4a8c', secondary: '#ffffff', outline: '#0a4a8c', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/cruzeiro.png',
    imgScale: 1.00, // 177×178 ~ quadrado
  },
  {
    id: 'flamengo',      name: 'Flamengo',              shortName: 'Flamengo',     abbr: 'FLA',
    primary: '#e30613', secondary: '#000000', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/flamengo.png',
    imgScale: 1.03, // 191×204
  },
  {
    id: 'fluminense',    name: 'Fluminense',            shortName: 'Fluminense',   abbr: 'FLU',
    primary: '#7a0019', secondary: '#0a4d2c', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/fluminense.png',
    imgScale: 1.04, // 181×195
  },
  {
    id: 'goias',         name: 'Goiás',                 shortName: 'Goiás',        abbr: 'GOI',
    primary: '#006f3c', secondary: '#ffffff', outline: '#006f3c', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/goias.png',
    imgScale: 1.00, // 184×181 ~ quadrado
  },
  {
    id: 'inter',         name: 'Internacional',         shortName: 'Inter',        abbr: 'INT',
    primary: '#c8102e', secondary: '#ffffff', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/inter.png',
    imgScale: 1.00, // 208×206 ~ quadrado
  },
  {
    id: 'nautico',       name: 'Náutico',               shortName: 'Náutico',      abbr: 'NAU',
    primary: '#c8102e', secondary: '#ffffff', outline: '#c8102e', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/nautico.png',
    imgScale: 1.00, // 209×206 ~ quadrado
  },
  {
    id: 'palmeiras',     name: 'Palmeiras',             shortName: 'Palmeiras',    abbr: 'PAL',
    primary: '#006032', secondary: '#ffffff', outline: '#006032', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/palmeiras.png',
    imgScale: 1.00, // 209×206 ~ quadrado
  },
  {
    id: 'santos',        name: 'Santos',                shortName: 'Santos',       abbr: 'SAN',
    primary: '#ffffff', secondary: '#000000', outline: '#000000', textColor: '#000000',
    img: '/images/teaching/probability/two-dices/escudos/santos.png',
    imgScale: 1.01, // 204×199 ~ quadrado
  },
  {
    id: 'sao_paulo',     name: 'São Paulo',             shortName: 'São Paulo',    abbr: 'SPF',
    primary: '#cf0a2c', secondary: '#000000', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/sao_paulo.png',
    imgScale: 1.02, // 208×201
  },
  {
    id: 'sport',         name: 'Sport Recife',          shortName: 'Sport',        abbr: 'SPO',
    primary: '#c8102e', secondary: '#000000', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/sport.png',
    imgScale: 1.02, // 205×197
  },
  {
    id: 'vitoria',       name: 'Vitória',               shortName: 'Vitória',      abbr: 'VIT',
    primary: '#c8102e', secondary: '#000000', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/vitoria.png',
    imgScale: 1.03, // 188×200
  },
  // ──── Os 4 escudos abaixo foram extraídos como PNGs individuais
  // do sprite-sheet original, usando bounding boxes detectados
  // automaticamente pelo `sharp` (análise de pixels não-transparentes).
  // Não há mais risco de invasão de vizinhos.
  {
    id: 'america_rn',    name: 'América de Natal',      shortName: 'América-RN',   abbr: 'AME',
    primary: '#c8102e', secondary: '#ffffff', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/america_rn.png',
    imgScale: 1.10,
  },
  {
    id: 'corinthians',   name: 'Corinthians',           shortName: 'Corinthians',  abbr: 'COR',
    primary: '#000000', secondary: '#ffffff', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/corinthians.png',
    imgScale: 1.10,
  },
  {
    id: 'vasco',         name: 'Vasco da Gama',         shortName: 'Vasco',        abbr: 'VAS',
    primary: '#000000', secondary: '#ffffff', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/vasco.png',
    imgScale: 1.18,
  },
  {
    id: 'gremio',        name: 'Grêmio',                shortName: 'Grêmio',       abbr: 'GRE',
    primary: '#0080c8', secondary: '#000000', outline: '#000000', textColor: '#ffffff',
    img: '/images/teaching/probability/two-dices/escudos/gremio.png',
    imgScale: 1.10,
  },
];

/** Sorteia 2 times distintos da lista. */
export function pickTwoTeams(): [Team, Team] {
  const i = Math.floor(Math.random() * TEAMS.length);
  let j = Math.floor(Math.random() * TEAMS.length);
  while (j === i) j = Math.floor(Math.random() * TEAMS.length);
  return [TEAMS[i], TEAMS[j]];
}

/** Recupera Team por id. */
export function getTeamById(id: TeamId): Team | undefined {
  return TEAMS.find(t => t.id === id);
}
