import { Router, type IRouter } from "express";
import { db, ngosTable, usersTable, foodPostsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetNgoParams,
  GetNgoResponse,
  ListNgosResponse,
  GetMatchedNgosParams,
  GetMatchedNgosResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatNgo(ngo: typeof ngosTable.$inferSelect) {
  return {
    id: ngo.id,
    userId: ngo.userId,
    organizationName: ngo.organizationName,
    address: ngo.address,
    phone: ngo.phone ?? null,
    capacity: ngo.capacity ?? null,
    reliabilityScore: ngo.reliabilityScore,
    totalClaimsCompleted: ngo.totalClaimsCompleted,
    createdAt: ngo.createdAt.toISOString(),
  };
}

router.get("/ngos", async (_req, res): Promise<void> => {
  const ngos = await db.select().from(ngosTable);
  res.json(ListNgosResponse.parse({ ngos: ngos.map(formatNgo) }));
});

router.get("/ngos/match/:postId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.postId) ? req.params.postId[0] : req.params.postId;
  const params = GetMatchedNgosParams.safeParse({ postId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid postId" });
    return;
  }

  const [post] = await db.select().from(foodPostsTable).where(eq(foodPostsTable.id, params.data.postId));
  if (!post) {
    res.status(404).json({ error: "Food post not found" });
    return;
  }

  const ngos = await db.select().from(ngosTable);

  const matches = ngos.map((ngo) => {
    const urgencyScore = Math.max(0, 100 - (post.expiryMinutes / 60) * 10);
    const reliabilityScore = ngo.reliabilityScore;
    const capacityScore = ngo.capacity ? Math.min(100, (ngo.capacity / 50) * 20) : 50;
    const experienceScore = Math.min(100, ngo.totalClaimsCompleted * 5);
    const score = Math.round(
      urgencyScore * 0.3 + reliabilityScore * 0.4 + capacityScore * 0.1 + experienceScore * 0.2
    );

    const reasons = [];
    if (reliabilityScore >= 90) reasons.push("high reliability");
    if (ngo.totalClaimsCompleted > 10) reasons.push("experienced with pickups");
    if (urgencyScore > 50) reasons.push("matched urgency window");
    if (ngo.capacity && ngo.capacity >= (post.servings ?? 0)) reasons.push("sufficient capacity");

    return {
      ngo: formatNgo(ngo),
      score: Math.min(100, score),
      reason: reasons.length > 0 ? reasons.join(", ") : "Available in your area",
    };
  });

  matches.sort((a, b) => b.score - a.score);

  res.json(GetMatchedNgosResponse.parse({ matches: matches.slice(0, 5) }));
});

router.get("/ngos/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetNgoParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [ngo] = await db.select().from(ngosTable).where(eq(ngosTable.id, params.data.id));
  if (!ngo) {
    res.status(404).json({ error: "NGO not found" });
    return;
  }

  res.json(GetNgoResponse.parse(formatNgo(ngo)));
});

export default router;
