import { pgTable, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const claimStatusEnum = pgEnum("claim_status", [
  "claimed",
  "picked_up",
  "delivered",
  "cancelled",
]);

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  ngoId: integer("ngo_id").notNull(),
  volunteerId: integer("volunteer_id"),
  status: claimStatusEnum("status").notNull().default("claimed"),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({ id: true, claimedAt: true });
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
