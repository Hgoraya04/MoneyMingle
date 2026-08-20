import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET: string = (() => {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET is not set — copy backend/.env.example to backend/.env and fill it in.");
  }
  return value;
})();

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): string {
  const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
  return payload.sub;
}
