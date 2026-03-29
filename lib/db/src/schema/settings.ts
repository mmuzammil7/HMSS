import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("mess_settings", {
  id: serial("id").primaryKey(),
  messName: text("mess_name").notNull().default("Hostel Mess"),
  vegDietRate: real("veg_diet_rate").notNull().default(100),
  nonVegDietRate: real("non_veg_diet_rate").notNull().default(120),
  breakfastRate: real("breakfast_rate").notNull().default(30),
  currency: text("currency").notNull().default("₹"),
  residentUsername: text("resident_username").notNull().default("resident"),
  residentPin: text("resident_pin").notNull().default("123456"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
