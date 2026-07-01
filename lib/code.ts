import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const URL_SAFE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
const PRINTABLE_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*-_+=?";

const generateCode = customAlphabet(URL_SAFE_ALPHABET, 6);
const generateToken = customAlphabet(URL_SAFE_ALPHABET, 24);
const generatePassword = customAlphabet(PRINTABLE_PASSWORD_ALPHABET, 12);

export function newCodeCandidate(): string {
  return generateCode();
}

export function newEditTokenCandidate(): string {
  return generateToken();
}

export async function createUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = newCodeCandidate();
    const [person, location] = await Promise.all([
      prisma.person.findUnique({ where: { code } }),
      prisma.locationCard.findUnique({ where: { code } }),
    ]);
    if (!person && !location) return code;
  }
  throw new Error("Failed to generate unique code after 10 attempts");
}

export async function createUniqueEditToken(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const token = newEditTokenCandidate();
    const exists = await prisma.person.findUnique({
      where: { editToken: token },
    });
    if (!exists) return token;
  }
  throw new Error("Failed to generate unique edit token after 10 attempts");
}

export function newPlainPassword(): string {
  return generatePassword();
}
