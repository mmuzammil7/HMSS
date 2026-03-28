import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const residentsTable = pgTable("residents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  roomNumber: text("room_number").notNull(),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  dietType: text("diet_type", { enum: ["veg", "non-veg"] }).notNull().default("veg"),
  hasUnpaidBill: boolean("has_unpaid_bill").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResidentSchema = createInsertSchema(residentsTable).omit({ id: true, createdAt: true });
export type InsertResident = z.infer<typeof insertResidentSchema>;
export type Resident = typeof residentsTable.$inferSelect;
