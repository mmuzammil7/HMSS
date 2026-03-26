import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

export async function getOrCreateSettings() {
  const [existing] = await db.select().from(settingsTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      id: settings.id,
      messName: settings.messName,
      dietRatePerDay: settings.dietRatePerDay,
      breakfastRate: settings.breakfastRate,
      currency: settings.currency,
      whatsappApiKey: settings.whatsappApiKey ?? "",
      whatsappSender: settings.whatsappSender ?? "",
      hasWhatsapp: !!(settings.whatsappApiKey && settings.whatsappSender),
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
        whatsappApiKey: body.whatsappApiKey ?? existing.whatsappApiKey,
        whatsappSender: body.whatsappSender ?? existing.whatsappSender,
        updatedAt: new Date(),
      })
      .where(eq(settingsTable.id, existing.id))
      .returning();
    res.json({
      id: updated.id,
      messName: updated.messName,
      dietRatePerDay: updated.dietRatePerDay,
      breakfastRate: updated.breakfastRate,
      currency: updated.currency,
      whatsappApiKey: updated.whatsappApiKey ?? "",
      whatsappSender: updated.whatsappSender ?? "",
      hasWhatsapp: !!(updated.whatsappApiKey && updated.whatsappSender),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(400).json({ message: "Failed to update settings" });
  }
});

export default router;
