import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("mess_settings", {
  id: serial("id").primaryKey(),
  messName: text("mess_name").notNull().default("Hostel Mess"),
  dietRatePerDay: real("diet_rate_per_day").notNull().default(100),
  breakfastRate: real("breakfast_rate").notNull().default(30),
  currency: text("currency").notNull().default("₹"),
  adminPinHash: text("admin_pin_hash"),
  whatsappApiKey: text("whatsapp_api_key"),
  whatsappSender: text("whatsapp_sender"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
