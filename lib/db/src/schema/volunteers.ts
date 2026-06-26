import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const volunteersTable = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVolunteerSchema = createInsertSchema(volunteersTable).omit({ id: true, createdAt: true });
export type InsertVolunteer = z.infer<typeof insertVolunteerSchema>;
export type Volunteer = typeof volunteersTable.$inferSelect;
