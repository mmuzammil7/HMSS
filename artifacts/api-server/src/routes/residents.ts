import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, residentsTable } from "@workspace/db";
import {
  CreateResidentBody,
  UpdateResidentParams,
  UpdateResidentBody,
  DeleteResidentParams,
  ToggleUnpaidBillParams,
  ToggleUnpaidBillBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatResident(r: typeof residentsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    roomNumber: r.roomNumber,
    dietType: r.dietType,
    hasUnpaidBill: r.hasUnpaidBill,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/residents", async (req, res) => {
  try {
    const residents = await db.select().from(residentsTable).orderBy(residentsTable.name);
    res.json(residents.map(formatResident));
  } catch (err) {
    req.log.error({ err }, "Failed to get residents");
    res.status(500).json({ message: "Failed to get residents" });
  }
});

router.post("/residents", async (req, res) => {
  try {
    const body = CreateResidentBody.parse(req.body);
    const [resident] = await db.insert(residentsTable).values({
      name: body.name,
      roomNumber: body.roomNumber,
      dietType: (body.dietType as "veg" | "non-veg") ?? "veg",
      isActive: body.isActive ?? true,
      whatsappNumber: "",
    }).returning();
    res.status(201).json(formatResident(resident));
  } catch (err) {
    req.log.error({ err }, "Failed to create resident");
    res.status(400).json({ message: "Failed to create resident" });
  }
});

router.put("/residents/:id", async (req, res) => {
  try {
    const { id } = UpdateResidentParams.parse(req.params);
    const body = UpdateResidentBody.parse(req.body);
    const [resident] = await db
      .update(residentsTable)
      .set({
        name: body.name,
        roomNumber: body.roomNumber,
        dietType: (body.dietType as "veg" | "non-veg") ?? "veg",
        isActive: body.isActive ?? true,
      })
      .where(eq(residentsTable.id, id))
      .returning();
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }
    res.json(formatResident(resident));
  } catch (err) {
    req.log.error({ err }, "Failed to update resident");
    res.status(400).json({ message: "Failed to update resident" });
  }
});

router.patch("/residents/:id/unpaid-bill", async (req, res) => {
  try {
    const { id } = ToggleUnpaidBillParams.parse(req.params);
    const { hasUnpaidBill } = ToggleUnpaidBillBody.parse(req.body);
    const [resident] = await db
      .update(residentsTable)
      .set({ hasUnpaidBill })
      .where(eq(residentsTable.id, id))
      .returning();
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }
    res.json(formatResident(resident));
  } catch (err) {
    req.log.error({ err }, "Failed to toggle unpaid bill flag");
    res.status(400).json({ message: "Failed to toggle unpaid bill flag" });
  }
});

router.delete("/residents/:id", async (req, res) => {
  try {
    const { id } = DeleteResidentParams.parse(req.params);
    await db.delete(residentsTable).where(eq(residentsTable.id, id));
    res.json({ message: "Resident deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete resident");
    res.status(400).json({ message: "Failed to delete resident" });
  }
});

export default router;
