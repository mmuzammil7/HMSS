import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, attendanceTable, residentsTable, settingsTable } from "@workspace/db";
import { GetBillingSummaryQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/billing/summary", async (req, res) => {
  try {
    const { month, year } = GetBillingSummaryQueryParams.parse(req.query);

    const [settings] = await db.select().from(settingsTable).limit(1);
    const vegDietRate = settings?.vegDietRate ?? 100;
    const nonVegDietRate = settings?.nonVegDietRate ?? 120;
    const breakfastRate = settings?.breakfastRate ?? 30;
    const currency = settings?.currency ?? "₹";
    const messName = settings?.messName ?? "Hostel Mess";

    const residents = await db
      .select()
      .from(residentsTable)
      .where(eq(residentsTable.isActive, true))
      .orderBy(residentsTable.name);

    const attendance = await db
      .select()
      .from(attendanceTable)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${attendanceTable.date}::date) = ${month}`,
          sql`EXTRACT(YEAR FROM ${attendanceTable.date}::date) = ${year}`
        )
      );

    const bills = residents.map((resident) => {
      const dietRate = resident.dietType === "non-veg" ? nonVegDietRate : vegDietRate;
      const residentAttendance = attendance.filter((a) => a.residentId === resident.id);
      const presentDays = residentAttendance.filter((a) => a.status === "present").length;
      const halfDays = residentAttendance.filter((a) => a.status === "half").length;
      const breakfastDays = residentAttendance.filter((a) => a.status === "breakfast").length;
      const absentDays = residentAttendance.filter((a) => a.status === "absent").length;
      const totalDays = presentDays + halfDays * 0.5 + breakfastDays * (breakfastRate / dietRate);
      const totalAmount = Math.round(totalDays * dietRate * 100) / 100;

      return {
        residentId: resident.id,
        residentName: resident.name,
        roomNumber: resident.roomNumber,
        dietType: resident.dietType,
        hasUnpaidBill: resident.hasUnpaidBill,
        presentDays,
        halfDays,
        breakfastDays,
        absentDays,
        totalDays: Math.round(totalDays * 100) / 100,
        dietRate,
        totalAmount,
      };
    });

    const totalCollectable = bills.reduce((sum, b) => sum + b.totalAmount, 0);

    res.json({
      month,
      year,
      messName,
      vegDietRate,
      nonVegDietRate,
      breakfastRate,
      currency,
      bills,
      totalCollectable: Math.round(totalCollectable * 100) / 100,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get billing summary");
    res.status(500).json({ message: "Failed to get billing summary" });
  }
});

export default router;
