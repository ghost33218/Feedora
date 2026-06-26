import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db, usersTable, ngosTable, volunteersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterUserBody,
  LoginUserBody,
  RegisterUserResponse,
  LoginUserResponse,
  GetCurrentUserResponse,
} from "@workspace/api-zod";
import { storeToken, getUserFromRequest } from "../lib/auth";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "feedora_salt_2024").digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    organizationName: user.organizationName ?? null,
    address: user.address ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, role, phone, organizationName, address } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = hashPassword(password);

  const [user] = await db.insert(usersTable).values({
    name,
    email,
    passwordHash,
    role: role as "donor" | "ngo" | "volunteer",
    phone: phone ?? null,
    organizationName: organizationName ?? null,
    address: address ?? null,
  }).returning();

  if (role === "ngo") {
    await db.insert(ngosTable).values({
      userId: user.id,
      organizationName: organizationName || name,
      address: address || "",
      phone: phone ?? null,
      capacity: null,
      reliabilityScore: 100,
      totalClaimsCompleted: 0,
    });
  } else if (role === "volunteer") {
    await db.insert(volunteersTable).values({
      userId: user.id,
      totalDeliveries: 0,
    });
  }

  const token = generateToken();
  storeToken(token, user.id);

  res.status(201).json(RegisterUserResponse.parse({ user: formatUser(user), token }));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const passwordHash = hashPassword(password);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || user.passwordHash !== passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken();
  storeToken(token, user.id);

  res.json(LoginUserResponse.parse({ user: formatUser(user), token }));
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(GetCurrentUserResponse.parse(formatUser(user)));
});

export default router;
