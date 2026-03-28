import { pgTable, serial, integer, text, date, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { residentsTable } from "./residents";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").notNull().references(() => residentsTable.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: text("status", { enum: ["present", "half", "absent", "breakfast"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  unique("attendance_resident_date_unique").on(t.residentId, t.date),
]);

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
