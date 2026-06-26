import { pgTable, serial, integer, text, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foodTypeEnum = pgEnum("food_type", [
  "cooked_meal",
  "raw_produce",
  "packaged_food",
  "bakery",
  "dairy",
  "beverages",
  "other",
]);

export const foodUnitEnum = pgEnum("food_unit", ["kg", "portions", "boxes", "liters", "items"]);

export const foodPostStatusEnum = pgEnum("food_post_status", [
  "pending",
  "claimed",
  "in_transit",
  "delivered",
  "cancelled",
  "expired",
]);

export const foodPostsTable = pgTable("food_posts", {
  id: serial("id").primaryKey(),
  donorId: integer("donor_id").notNull(),
  foodType: foodTypeEnum("food_type").notNull(),
  quantity: real("quantity").notNull(),
  unit: foodUnitEnum("unit").notNull(),
  expiryMinutes: integer("expiry_minutes").notNull(),
  address: text("address").notNull(),
  notes: text("notes"),
  servings: integer("servings"),
  status: foodPostStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFoodPostSchema = createInsertSchema(foodPostsTable).omit({ id: true, createdAt: true });
export type InsertFoodPost = z.infer<typeof insertFoodPostSchema>;
export type FoodPost = typeof foodPostsTable.$inferSelect;
