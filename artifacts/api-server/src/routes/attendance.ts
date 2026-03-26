import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, attendanceTable, residentsTable } from "@workspace/db";
import {
  GetAttendanceQueryParams,
  MarkAttendanceBody,
  BulkMarkAttendanceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/attendance", async (req, res) => {
  try {
    const params = GetAttendanceQueryParams.parse(req.query);
    const conditions = [];

    if (params.residentId) {
      conditions.push(eq(attendanceTable.residentId, params.residentId));
    }
    if (params.date) {
      conditions.push(eq(attendanceTable.date, params.date));
    }
    if (params.month && params.year) {
      conditions.push(
        sql`EXTRACT(MONTH FROM ${attendanceTable.date}::date) = ${params.month}`,
        sql`EXTRACT(YEAR FROM ${attendanceTable.date}::date) = ${params.year}`
      );
    }

    const records = await db
      .select({
        id: attendanceTable.id,
        residentId: attendanceTable.residentId,
        residentName: residentsTable.name,
        date: attendanceTable.date,
        status: attendanceTable.status,
        createdAt: attendanceTable.createdAt,
      })
      .from(attendanceTable)
      .innerJoin(residentsTable, eq(attendanceTable.residentId, residentsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(attendanceTable.date, residentsTable.name);

    res.json(
      records.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get attendance");
    res.status(500).json({ message: "Failed to get attendance" });
  }
});

router.post("/attendance", async (req, res) => {
  try {
    const body = MarkAttendanceBody.parse(req.body);

    const existing = await db
      .select()
      .from(attendanceTable)
      .where(
        and(
          eq(attendanceTable.residentId, body.residentId),
          eq(attendanceTable.date, body.date)
        )
      )
      .limit(1);

    let record;
    if (existing.length > 0) {
      [record] = await db
        .update(attendanceTable)
        .set({ status: body.status })
        .where(eq(attendanceTable.id, existing[0].id))
        .returning();
    } else {
      [record] = await db
        .insert(attendanceTable)
        .values({
          residentId: body.residentId,
          date: body.date,
          status: body.status,
        })
        .returning();
    }

    const resident = await db
      .select({ name: residentsTable.name })
      .from(residentsTable)
      .where(eq(residentsTable.id, body.residentId))
      .limit(1);

    res.json({
      ...record,
      residentName: resident[0]?.name ?? "",
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to mark attendance");
    res.status(400).json({ message: "Failed to mark attendance" });
  }
});

router.post("/attendance/bulk", async (req, res) => {
  try {
    const body = BulkMarkAttendanceBody.parse(req.body);
    const results = [];

    for (const entry of body.entries) {
      const existing = await db
        .select()
        .from(attendanceTable)
        .where(
          and(
            eq(attendanceTable.residentId, entry.residentId),
            eq(attendanceTable.date, body.date)
          )
        )
        .limit(1);

      let record;
      if (existing.length > 0) {
        [record] = await db
          .update(attendanceTable)
          .set({ status: entry.status })
          .where(eq(attendanceTable.id, existing[0].id))
          .returning();
      } else {
        [record] = await db
          .insert(attendanceTable)
          .values({
            residentId: entry.residentId,
            date: body.date,
            status: entry.status,
          })
          .returning();
      }

      const resident = await db
        .select({ name: residentsTable.name })
        .from(residentsTable)
        .where(eq(residentsTable.id, entry.residentId))
        .limit(1);

      results.push({
        ...record,
        residentName: resident[0]?.name ?? "",
        createdAt: record.createdAt.toISOString(),
      });
    }

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to bulk mark attendance");
    res.status(400).json({ message: "Failed to bulk mark attendance" });
  }
});

export default router;
