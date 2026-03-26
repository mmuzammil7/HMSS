import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      ...settings,
      updatedAt: settings.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ message: "Failed to get settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const body = UpdateSettingsBody.parse(req.body);
    const existing = await getOrCreateSettings();
    const [updated] = await db
      .update(settingsTable)
      .set({
        messName: body.messName,
        dietRatePerDay: body.dietRatePerDay,
        breakfastRate: body.breakfastRate,
        currency: body.currency,
        updatedAt: new Date(),
      })
      .where(eq(settingsTable.id, existing.id))
      .returning();
    res.json({
      ...updated,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(400).json({ message: "Failed to update settings" });
  }
});

export default router;
