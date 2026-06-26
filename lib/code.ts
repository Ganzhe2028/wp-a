import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

const generateCode = customAlphabet(ALPHABET, 6);
const generateToken = customAlphabet(ALPHABET, 24);

export async function createUniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const exists = await prisma.person.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique code after 10 attempts");
}

export async function createUniqueEditToken(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const token = generateToken();
    const exists = await prisma.person.findUnique({
      where: { editToken: token },
    });
    if (!exists) return token;
  }
  throw new Error("Failed to generate unique edit token after 10 attempts");
}

const generatePassword = customAlphabet(ALPHABET, 6);

export function newPlainPassword(): string {
  return generatePassword();
}
