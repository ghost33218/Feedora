import type { Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const tokenStore = new Map<string, number>();

export function storeToken(token: string, userId: number) {
  tokenStore.set(token, userId);
}

export async function getUserFromRequest(req: Request) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7);
  if (!token) return null;

  const userId = tokenStore.get(token);
  if (!userId) return null;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user ?? null;
}
