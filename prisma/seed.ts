/**
 * Seed do banco — popula os 30 alunos REAIS (cartões impressos do PDF)
 * + 10 alunos de TESTE (alunoTEST01..alunoTEST10) com senhas aleatórias.
 *
 * Idempotente: usa upsert por username. Re-rodar não duplica nem
 * sobrescreve hashes existentes (preserva senhas se já populadas).
 *
 * Rode com: `npm run db:seed`
 *
 * IMPORTANTE: ao rodar pela primeira vez, este script IMPRIME as 10
 * senhas dos alunos de teste no terminal. Copie e guarde — depois disso
 * elas só vivem hasheadas no banco.
 */
import { PrismaClient } from '@prisma/client';
import { randomInt } from 'crypto';
import { hashPassword } from '../src/lib/passwords';

const prisma = new PrismaClient();

// ─── 30 alunos REAIS (extraídos do PDF cartoes_codigos) ──────────
const REAL_STUDENTS: Array<{ username: string; password: string }> = [
  { username: 'alunoW915', password: '349718' },
  { username: 'alunoC485', password: '843216' },
  { username: 'alunoB123', password: '483267' },
  { username: 'alunoCE61', password: '498273' },
  { username: 'alunoDH29', password: '391257' },
  { username: 'alunoT61',  password: '643897' },
  { username: 'alunoC53',  password: '237846' },
  { username: 'alunoG312', password: '687293' },
  { username: 'alunoS213', password: '839457' },
  { username: 'alunoP571', password: '546893' },
  { username: 'alunoK86',  password: '267859' },
  { username: 'alunoAJ53', password: '318652' },
  { username: 'alunoSK86', password: '354269' },
  { username: 'alunoBU21', password: '425869' },
  { username: 'alunoU657', password: '876421' },
  { username: 'alunoGM69', password: '586427' },
  { username: 'alunoE21',  password: '758243' },
  { username: 'alunoZ398', password: '421876' },
  { username: 'alunoH829', password: '924867' },
  { username: 'alunoN29',  password: '743591' },
  { username: 'alunoV743', password: '593287' },
  { username: 'alunoRL78', password: '875629' },
  { username: 'alunoB45',  password: '719345' },
  { username: 'alunoZV45', password: '961738' },
  { username: 'alunoD69',  password: '472816' },
  { username: 'alunoM78',  password: '157834' },
  { username: 'alunoXN37', password: '915872' },
  { username: 'alunoL12',  password: '836592' },
  { username: 'alunoW37',  password: '486725' },
  { username: 'alunoTP12', password: '298157' },
];

// Gera 6 dígitos aleatórios (mesmo formato dos cartões reais).
function randomPassword6(): string {
  return String(randomInt(100_000, 1_000_000));
}

async function main() {
  // ─── REAIS: upsert ────────────────────────────────────────────
  let realInserted = 0;
  let realSkipped = 0;
  for (const s of REAL_STUDENTS) {
    const existing = await prisma.user.findUnique({ where: { username: s.username } });
    if (existing) {
      realSkipped += 1;
      continue;
    }
    await prisma.user.create({
      data: {
        username: s.username,
        passwordHash: await hashPassword(s.password),
        isTest: false,
      },
    });
    realInserted += 1;
  }
  console.log(`[seed] Alunos REAIS: ${realInserted} inseridos, ${realSkipped} já existiam.`);

  // ─── TESTE: gera ou recupera 10 ───────────────────────────────
  const testCredentials: Array<{ username: string; password: string }> = [];
  for (let i = 1; i <= 10; i++) {
    const username = `alunoTEST${String(i).padStart(2, '0')}`;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      testCredentials.push({ username, password: '(já existia — senha original preservada, não exibida)' });
      continue;
    }
    const password = randomPassword6();
    await prisma.user.create({
      data: {
        username,
        passwordHash: await hashPassword(password),
        isTest: true,
      },
    });
    testCredentials.push({ username, password });
  }

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║          CREDENCIAIS DE TESTE (anote agora!)         ║');
  console.log('╚════════════════════════════════════════════════════╝');
  for (const c of testCredentials) {
    console.log(`  ${c.username}  →  senha: ${c.password}`);
  }
  console.log('\n  As senhas só são exibidas nesta execução do seed.');
  console.log('  Depois disso, só ficam hasheadas no banco.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
