import { Router, type IRouter } from "express";
import { db, foodPostsTable, usersTable, ngosTable, volunteersTable, claimsTable } from "@workspace/db";
import { eq, count, sql, desc } from "drizzle-orm";
import {
  GetImpactSummaryResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
  GetImpactByFoodTypeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/impact/summary", async (_req, res): Promise<void> => {
  const [totalMealsRow] = await db.select({
    meals: sql<number>`COALESCE(SUM(${foodPostsTable.servings}), 0)`,
  }).from(foodPostsTable).where(eq(foodPostsTable.status, "delivered"));

  const [totalDonations] = await db.select({ count: count() }).from(foodPostsTable);

  const [totalDelivered] = await db.select({ count: count() })
    .from(foodPostsTable)
    .where(eq(foodPostsTable.status, "delivered"));

  const [totalNgos] = await db.select({ count: count() }).from(ngosTable);

  const [totalDonors] = await db.select({ count: count() })
    .from(usersTable)
    .where(eq(usersTable.role, "donor"));

  const [totalVolunteers] = await db.select({ count: count() }).from(volunteersTable);

  const [activePosts] = await db.select({ count: count() })
    .from(foodPostsTable)
    .where(eq(foodPostsTable.status, "pending"));

  const mealsSaved = Number(totalMealsRow.meals) || 0;
  const co2AvoidedKg = Math.round(mealsSaved * 0.5 * 10) / 10;

  res.json(GetImpactSummaryResponse.parse({
    totalMealsSaved: mealsSaved,
    totalDonations: Number(totalDonations.count),
    totalDelivered: Number(totalDelivered.count),
    totalNgos: Number(totalNgos.count),
    totalDonors: Number(totalDonors.count),
    totalVolunteers: Number(totalVolunteers.count),
    co2AvoidedKg,
    activePosts: Number(activePosts.count),
  }));
});

router.get("/impact/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

  const posts = await db
    .select({ post: foodPostsTable, donorName: usersTable.name })
    .from(foodPostsTable)
    .leftJoin(usersTable, eq(foodPostsTable.donorId, usersTable.id))
    .orderBy(desc(foodPostsTable.createdAt))
    .limit(limit * 2);

  const claims = await db
    .select({ claim: claimsTable, ngo: ngosTable })
    .from(claimsTable)
    .leftJoin(ngosTable, eq(claimsTable.ngoId, ngosTable.id))
    .orderBy(desc(claimsTable.claimedAt))
    .limit(limit * 2);

  type Activity = {
    id: number;
    type: "post_created" | "post_claimed" | "pickup_done" | "delivery_done";
    description: string;
    donorName: string | null;
    ngoName: string | null;
    foodType: string | null;
    servings: number | null;
    createdAt: string;
  };

  const activities: Activity[] = [];

  for (const { post, donorName } of posts) {
    activities.push({
      id: post.id,
      type: "post_created",
      description: `${donorName ?? "A donor"} posted ${post.quantity} ${post.unit} of ${post.foodType.replace("_", " ")}`,
      donorName: donorName ?? null,
      ngoName: null,
      foodType: post.foodType,
      servings: post.servings ?? null,
      createdAt: post.createdAt.toISOString(),
    });
  }

  for (const { claim, ngo } of claims) {
    if (claim.deliveredAt) {
      activities.push({
        id: claim.id + 100000,
        type: "delivery_done",
        description: `${ngo?.organizationName ?? "An NGO"} received a food donation`,
        donorName: null,
        ngoName: ngo?.organizationName ?? null,
        foodType: null,
        servings: null,
        createdAt: claim.deliveredAt.toISOString(),
      });
    } else if (claim.pickedUpAt) {
      activities.push({
        id: claim.id + 200000,
        type: "pickup_done",
        description: `Volunteer picked up food for ${ngo?.organizationName ?? "an NGO"}`,
        donorName: null,
        ngoName: ngo?.organizationName ?? null,
        foodType: null,
        servings: null,
        createdAt: claim.pickedUpAt.toISOString(),
      });
    } else {
      activities.push({
        id: claim.id + 300000,
        type: "post_claimed",
        description: `${ngo?.organizationName ?? "An NGO"} claimed a food post`,
        donorName: null,
        ngoName: ngo?.organizationName ?? null,
        foodType: null,
        servings: null,
        createdAt: claim.claimedAt.toISOString(),
      });
    }
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(GetRecentActivityResponse.parse({ activities: activities.slice(0, limit) }));
});

router.get("/impact/by-food-type", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      foodType: foodPostsTable.foodType,
      count: count(),
      servings: sql<number>`COALESCE(SUM(${foodPostsTable.servings}), 0)`,
    })
    .from(foodPostsTable)
    .groupBy(foodPostsTable.foodType);

  const breakdown = rows.map((r) => ({
    foodType: r.foodType,
    count: Number(r.count),
    servings: Number(r.servings),
  }));

  res.json(GetImpactByFoodTypeResponse.parse({ breakdown }));
});

export default router;
