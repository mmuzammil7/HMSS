import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, residentsTable } from "@workspace/db";
import {
  CreateResidentBody,
  UpdateResidentParams,
  UpdateResidentBody,
  DeleteResidentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/residents", async (req, res) => {
  try {
    const residents = await db.select().from(residentsTable).orderBy(residentsTable.name);
    const result = residents.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
    res.json(result);
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
      whatsappNumber: body.whatsappNumber,
      isActive: body.isActive ?? true,
    }).returning();
    res.status(201).json({
      ...resident,
      createdAt: resident.createdAt.toISOString(),
    });
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
        whatsappNumber: body.whatsappNumber,
        isActive: body.isActive ?? true,
      })
      .where(eq(residentsTable.id, id))
      .returning();
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }
    res.json({
      ...resident,
      createdAt: resident.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update resident");
    res.status(400).json({ message: "Failed to update resident" });
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
