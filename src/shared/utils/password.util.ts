import { pbkdf2Sync, timingSafeEqual } from 'crypto';
import cryptoRandomString from 'crypto-random-string';
import { genRandomBytes } from './common.util';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string) {
  const salt = genRandomBytes(16);

  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');

  return { salt, hash };
}

export function verifyPassword(options: { password: string; salt: string; hash: string }) {
  const computedHash = pbkdf2Sync(options.password, options.salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');

  return timingSafeEqual(Buffer.from(options.hash, 'hex'), Buffer.from(computedHash, 'hex'));
}

export function generateRandomPassword(length: number = 16): string {
  return cryptoRandomString({ length, type: 'alphanumeric' });
}
