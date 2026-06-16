/**
 * Hash / compare de senhas via bcrypt (10 rounds).
 * Mantém a API enxuta — outras camadas (auth, seed) usam só estes 2.
 */
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
