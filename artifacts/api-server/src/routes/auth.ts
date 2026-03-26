import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { VerifyPinBody, SetPinBody } from "@workspace/api-zod";

const router: IRouter = Router();

function hashPin(pin: string): string {
  return createHash("sha256").update(pin + "mess-salt-v1").digest("hex");
}

async function getSettings() {
  const [s] = await db.select().from(settingsTable).limit(1);
  if (s) return s;
  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/auth/has-pin", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ hasPin: !!settings.adminPinHash });
  } catch (err) {
    req.log.error({ err }, "Failed to check PIN");
    res.status(500).json({ message: "Failed to check PIN" });
  }
});

router.post("/auth/verify-pin", async (req, res) => {
  try {
    const { pin } = VerifyPinBody.parse(req.body);
    const settings = await getSettings();
    if (!settings.adminPinHash) {
      return res.json({ valid: true });
    }
    const valid = hashPin(pin) === settings.adminPinHash;
    res.json({ valid });
  } catch (err) {
    req.log.error({ err }, "Failed to verify PIN");
    res.status(400).json({ message: "Failed to verify PIN" });
  }
});

router.post("/auth/set-pin", async (req, res) => {
  try {
    const { currentPin, newPin } = SetPinBody.parse(req.body);
    const settings = await getSettings();
    if (settings.adminPinHash && currentPin) {
      const valid = hashPin(currentPin) === settings.adminPinHash;
      if (!valid) {
        return res.status(401).json({ message: "Current PIN is incorrect" });
      }
    } else if (settings.adminPinHash && !currentPin) {
      return res.status(401).json({ message: "Current PIN required to change PIN" });
    }
    await db
      .update(settingsTable)
      .set({ adminPinHash: hashPin(newPin), updatedAt: new Date() })
      .where(eq(settingsTable.id, settings.id));
    res.json({ message: "PIN updated successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to set PIN");
    res.status(400).json({ message: "Failed to set PIN" });
  }
});

export default router;
