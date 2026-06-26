import { Router, type IRouter } from "express";
import { db, claimsTable, ngosTable, volunteersTable, usersTable, foodPostsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import {
  ListClaimsResponse,
  MarkPickupParams,
  MarkPickupResponse,
  MarkDeliveryParams,
  MarkDeliveryResponse,
} from "@workspace/api-zod";
import { getUserFromRequest } from "../lib/auth";

const router: IRouter = Router();

function formatFoodPost(post: typeof foodPostsTable.$inferSelect, donorName: string, ngoName: string | null) {
  const expiresAt = new Date(post.createdAt.getTime() + post.expiryMinutes * 60 * 1000);
  return {
    id: post.id,
    donorId: post.donorId,
    donorName,
    foodType: post.foodType,
    quantity: post.quantity,
    unit: post.unit,
    expiryMinutes: post.expiryMinutes,
    address: post.address,
    notes: post.notes ?? null,
    servings: post.servings ?? null,
    status: post.status,
    claimedByNgoName: ngoName,
    createdAt: post.createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

async function formatClaim(claim: typeof claimsTable.$inferSelect) {
  const [ngo] = await db.select().from(ngosTable).where(eq(ngosTable.id, claim.ngoId));
  const [post] = await db.select({ post: foodPostsTable, donorName: usersTable.name })
    .from(foodPostsTable)
    .leftJoin(usersTable, eq(foodPostsTable.donorId, usersTable.id))
    .where(eq(foodPostsTable.id, claim.postId));

  let volunteerName: string | null = null;
  if (claim.volunteerId) {
    const [vol] = await db.select({ user: usersTable }).from(volunteersTable)
      .leftJoin(usersTable, eq(volunteersTable.userId, usersTable.id))
      .where(eq(volunteersTable.id, claim.volunteerId));
    volunteerName = vol?.user?.name ?? null;
  }

  return {
    id: claim.id,
    postId: claim.postId,
    ngoId: claim.ngoId,
    ngoName: ngo?.organizationName ?? null,
    volunteerId: claim.volunteerId ?? null,
    volunteerName,
    status: claim.status,
    claimedAt: claim.claimedAt.toISOString(),
    pickedUpAt: claim.pickedUpAt?.toISOString() ?? null,
    deliveredAt: claim.deliveredAt?.toISOString() ?? null,
    foodPost: post ? formatFoodPost(post.post, post.donorName ?? "Unknown", ngo?.organizationName ?? null) : null,
  };
}

router.get("/claims", async (req, res): Promise<void> => {
  const user = await getUserFromRequest(req);

  let claims: typeof claimsTable.$inferSelect[];

  if (user?.role === "ngo") {
    const [ngo] = await db.select().from(ngosTable).where(eq(ngosTable.userId, user.id));
    if (!ngo) {
      res.json(ListClaimsResponse.parse({ claims: [] }));
      return;
    }
    claims = await db.select().from(claimsTable).where(eq(claimsTable.ngoId, ngo.id));
  } else if (user?.role === "volunteer") {
    const [volunteer] = await db.select().from(volunteersTable).where(eq(volunteersTable.userId, user.id));
    if (!volunteer) {
      res.json(ListClaimsResponse.parse({ claims: [] }));
      return;
    }
    claims = await db.select().from(claimsTable).where(eq(claimsTable.volunteerId, volunteer.id));
  } else {
    claims = await db.select().from(claimsTable);
  }

  const formatted = await Promise.all(claims.map(formatClaim));
  res.json(ListClaimsResponse.parse({ claims: formatted }));
});

router.post("/claims/:id/pickup", async (req, res): Promise<void> => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkPickupParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.id, params.data.id));
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }

  let volunteerId = claim.volunteerId;
  if (user.role === "volunteer" && !volunteerId) {
    const [vol] = await db.select().from(volunteersTable).where(eq(volunteersTable.userId, user.id));
    if (vol) volunteerId = vol.id;
  }

  const [updated] = await db.update(claimsTable)
    .set({ status: "picked_up", pickedUpAt: new Date(), volunteerId })
    .where(eq(claimsTable.id, claim.id))
    .returning();

  await db.update(foodPostsTable).set({ status: "in_transit" }).where(eq(foodPostsTable.id, claim.postId));

  res.json(MarkPickupResponse.parse(await formatClaim(updated)));
});

router.post("/claims/:id/deliver", async (req, res): Promise<void> => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkDeliveryParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [claim] = await db.select().from(claimsTable).where(eq(claimsTable.id, params.data.id));
  if (!claim) {
    res.status(404).json({ error: "Claim not found" });
    return;
  }

  const [updated] = await db.update(claimsTable)
    .set({ status: "delivered", deliveredAt: new Date() })
    .where(eq(claimsTable.id, claim.id))
    .returning();

  await db.update(foodPostsTable).set({ status: "delivered" }).where(eq(foodPostsTable.id, claim.postId));

  if (claim.ngoId) {
    await db.update(ngosTable)
      .set({
        totalClaimsCompleted: db.$count(claimsTable, eq(claimsTable.ngoId, claim.ngoId)),
      })
      .where(eq(ngosTable.id, claim.ngoId));
  }

  if (claim.volunteerId) {
    const [vol] = await db.select().from(volunteersTable).where(eq(volunteersTable.id, claim.volunteerId));
    if (vol) {
      await db.update(volunteersTable)
        .set({ totalDeliveries: vol.totalDeliveries + 1 })
        .where(eq(volunteersTable.id, vol.id));
    }
  }

  res.json(MarkDeliveryResponse.parse(await formatClaim(updated)));
});

export default router;
