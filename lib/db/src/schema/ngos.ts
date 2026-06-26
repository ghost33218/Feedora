import { pgTable, serial, integer, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ngosTable = pgTable("ngos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  organizationName: text("organization_name").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  capacity: integer("capacity"),
  reliabilityScore: real("reliability_score").notNull().default(100),
  totalClaimsCompleted: integer("total_claims_completed").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNgoSchema = createInsertSchema(ngosTable).omit({ id: true, createdAt: true });
export type InsertNgo = z.infer<typeof insertNgoSchema>;
export type Ngo = typeof ngosTable.$inferSelect;
