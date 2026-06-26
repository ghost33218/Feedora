import { Router, type IRouter } from "express";
import { db, volunteersTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListVolunteersResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/volunteers", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ volunteer: volunteersTable, user: usersTable })
    .from(volunteersTable)
    .leftJoin(usersTable, eq(volunteersTable.userId, usersTable.id));

  const volunteers = rows.map(({ volunteer, user }) => ({
    id: volunteer.id,
    userId: volunteer.userId,
    name: user?.name ?? "Unknown",
    phone: user?.phone ?? null,
    totalDeliveries: volunteer.totalDeliveries,
    createdAt: volunteer.createdAt.toISOString(),
  }));

  res.json(ListVolunteersResponse.parse({ volunteers }));
});

export default router;
