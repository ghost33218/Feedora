import { Router, type IRouter } from "express";
import { db, foodPostsTable, usersTable, claimsTable, ngosTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import {
  CreateFoodPostBody,
  GetFoodPostParams,
  ListFoodPostsQueryParams,
  ListFoodPostsResponse,
  CreateFoodPostResponse,
  GetFoodPostResponse,
  ClaimFoodPostParams,
  ClaimFoodPostResponse,
  CancelFoodPostParams,
  CancelFoodPostResponse,
} from "@workspace/api-zod";
import { getUserFromRequest } from "../lib/auth";

const router: IRouter = Router();

function formatPost(post: typeof foodPostsTable.$inferSelect, donorName: string, claimedByNgoName: string | null) {
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
    claimedByNgoName: claimedByNgoName ?? null,
    createdAt: post.createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

router.get("/food-posts", async (req, res): Promise<void> => {
  const parsed = ListFoodPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, limit = 20, offset = 0 } = parsed.data;

  let query = db
    .select({
      post: foodPostsTable,
      donorName: usersTable.name,
    })
    .from(foodPostsTable)
    .leftJoin(usersTable, eq(foodPostsTable.donorId, usersTable.id))
    .orderBy(desc(foodPostsTable.createdAt))
    .$dynamic();

  if (status) {
    query = query.where(eq(foodPostsTable.status, status as typeof foodPostsTable.status._.data));
  }

  const rows = await query.limit(limit).offset(offset);

  const [{ count: total }] = await db.select({ count: count() }).from(foodPostsTable);

  const posts = await Promise.all(rows.map(async ({ post, donorName }) => {
    const claim = await db.select({ ngoId: claimsTable.ngoId })
      .from(claimsTable)
      .where(eq(claimsTable.postId, post.id))
      .limit(1);

    let ngoName: string | null = null;
    if (claim.length > 0) {
      const [ngo] = await db.select({ organizationName: ngosTable.organizationName })
        .from(ngosTable)
        .where(eq(ngosTable.id, claim[0].ngoId));
      ngoName = ngo?.organizationName ?? null;
    }

    return formatPost(post, donorName ?? "Unknown", ngoName);
  }));

  res.json(ListFoodPostsResponse.parse({ posts, total: Number(total) }));
});

router.post("/food-posts", async (req, res): Promise<void> => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateFoodPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { foodType, quantity, unit, expiryMinutes, address, notes, servings } = parsed.data;

  const [post] = await db.insert(foodPostsTable).values({
    donorId: user.id,
    foodType: foodType as typeof foodPostsTable.foodType._.data,
    quantity,
    unit: unit as typeof foodPostsTable.unit._.data,
    expiryMinutes,
    address,
    notes: notes ?? null,
    servings: servings ?? null,
    status: "pending",
  }).returning();

  res.status(201).json(CreateFoodPostResponse.parse(formatPost(post, user.name, null)));
});

router.get("/food-posts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFoodPostParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select({ post: foodPostsTable, donorName: usersTable.name })
    .from(foodPostsTable)
    .leftJoin(usersTable, eq(foodPostsTable.donorId, usersTable.id))
    .where(eq(foodPostsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Food post not found" });
    return;
  }

  const claim = await db.select({ ngoId: claimsTable.ngoId })
    .from(claimsTable)
    .where(eq(claimsTable.postId, row.post.id))
    .limit(1);

  let ngoName: string | null = null;
  if (claim.length > 0) {
    const [ngo] = await db.select({ organizationName: ngosTable.organizationName })
      .from(ngosTable)
      .where(eq(ngosTable.id, claim[0].ngoId));
    ngoName = ngo?.organizationName ?? null;
  }

  res.json(GetFoodPostResponse.parse(formatPost(row.post, row.donorName ?? "Unknown", ngoName)));
});

router.post("/food-posts/:id/claim", async (req, res): Promise<void> => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (user.role !== "ngo") {
    res.status(403).json({ error: "Only NGOs can claim food posts" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ClaimFoodPostParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [post] = await db.select().from(foodPostsTable).where(eq(foodPostsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Food post not found" });
    return;
  }
  if (post.status !== "pending") {
    res.status(400).json({ error: "Food post is no longer available" });
    return;
  }

  const [ngo] = await db.select().from(ngosTable).where(eq(ngosTable.userId, user.id));
  if (!ngo) {
    res.status(400).json({ error: "NGO profile not found" });
    return;
  }

  await db.update(foodPostsTable).set({ status: "claimed" }).where(eq(foodPostsTable.id, post.id));

  const [claim] = await db.insert(claimsTable).values({
    postId: post.id,
    ngoId: ngo.id,
    volunteerId: null,
    status: "claimed",
  }).returning();

  const claimOut = {
    id: claim.id,
    postId: claim.postId,
    ngoId: claim.ngoId,
    ngoName: ngo.organizationName,
    volunteerId: claim.volunteerId ?? null,
    volunteerName: null,
    status: claim.status,
    claimedAt: claim.claimedAt.toISOString(),
    pickedUpAt: claim.pickedUpAt?.toISOString() ?? null,
    deliveredAt: claim.deliveredAt?.toISOString() ?? null,
    foodPost: formatPost({ ...post, status: "claimed" }, "Unknown", ngo.organizationName),
  };

  res.json(ClaimFoodPostResponse.parse(claimOut));
});

router.post("/food-posts/:id/cancel", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CancelFoodPostParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [post] = await db.select().from(foodPostsTable).where(eq(foodPostsTable.id, params.data.id));
  if (!post) {
    res.status(404).json({ error: "Food post not found" });
    return;
  }

  const [updated] = await db.update(foodPostsTable)
    .set({ status: "cancelled" })
    .where(eq(foodPostsTable.id, post.id))
    .returning();

  res.json(CancelFoodPostResponse.parse(formatPost(updated, "Unknown", null)));
});

export default router;
