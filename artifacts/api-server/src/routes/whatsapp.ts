import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, attendanceTable, residentsTable, settingsTable } from "@workspace/db";
import { SendMonthlyBillsBody, SendReminderBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function sendWhatsAppMessage(
  to: string,
  message: string,
  apiKey: string,
  _sender: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const phone = to.replace(/\D/g, "");
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const text = await response.text();
    if (response.ok && !text.toLowerCase().includes("error")) {
      return { success: true };
    }
    return { success: false, error: `API error: ${text.slice(0, 100)}` };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function getResidentBill(residentId: number, month: number, year: number) {
  const [settings] = await db.select().from(settingsTable).limit(1);
  const dietRate = settings?.dietRatePerDay ?? 100;
  const breakfastRate = settings?.breakfastRate ?? 30;
  const currency = settings?.currency ?? "₹";
  const messName = settings?.messName ?? "Hostel Mess";
  const whatsappApiKey = settings?.whatsappApiKey ?? process.env.WHATSAPP_API_KEY ?? "";
  const whatsappSender = settings?.whatsappSender ?? process.env.WHATSAPP_SENDER ?? "";

  const [resident] = await db
    .select()
    .from(residentsTable)
    .where(eq(residentsTable.id, residentId));

  if (!resident) return null;

  const attendance = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.residentId, residentId),
        sql`EXTRACT(MONTH FROM ${attendanceTable.date}::date) = ${month}`,
        sql`EXTRACT(YEAR FROM ${attendanceTable.date}::date) = ${year}`
      )
    );

  const presentDays = attendance.filter((a) => a.status === "present").length;
  const halfDays = attendance.filter((a) => a.status === "half").length;
  const breakfastDays = attendance.filter((a) => a.status === "breakfast").length;
  const totalDays = presentDays + halfDays * 0.5 + breakfastDays * (breakfastRate / dietRate);
  const totalAmount = Math.round(totalDays * dietRate * 100) / 100;

  const monthName = new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long" });

  return {
    resident,
    presentDays,
    halfDays,
    breakfastDays,
    totalDays: Math.round(totalDays * 100) / 100,
    totalAmount,
    dietRate,
    breakfastRate,
    currency,
    messName,
    monthName,
    year,
    whatsappApiKey,
    whatsappSender,
  };
}

router.post("/whatsapp/send-bills", async (req, res) => {
  try {
    const { month, year } = SendMonthlyBillsBody.parse(req.body);

    const [settings] = await db.select().from(settingsTable).limit(1);
    const apiKey = settings?.whatsappApiKey ?? process.env.WHATSAPP_API_KEY ?? "";
    const sender = settings?.whatsappSender ?? process.env.WHATSAPP_SENDER ?? "";

    if (!apiKey || !sender) {
      return res.status(400).json({
        sent: 0,
        failed: 0,
        results: [],
        message: "WhatsApp not configured. Please set your API key and sender number in Settings.",
      });
    }

    const residents = await db
      .select()
      .from(residentsTable)
      .where(eq(residentsTable.isActive, true));

    const results = [];
    let sent = 0;
    let failed = 0;

    for (const resident of residents) {
      const bill = await getResidentBill(resident.id, month, year);
      if (!bill) continue;

      const message =
        `*${bill.messName} - Monthly Bill*\n\nDear ${resident.name} (Room ${resident.roomNumber}),\n\nYour mess bill for *${bill.monthName} ${year}*:\n\n` +
        `✅ Present: ${bill.presentDays} days\n` +
        `🔸 Half Day (P/2): ${bill.halfDays} days\n` +
        `🍳 Breakfast Only: ${bill.breakfastDays} days\n\n` +
        `💰 Diet Rate: ${bill.currency}${bill.dietRate}/day\n` +
        `📊 Effective Days: ${bill.totalDays}\n\n` +
        `*Total Amount: ${bill.currency}${bill.totalAmount}*\n\nPlease pay at your earliest convenience. Thank you!`;

      const result = await sendWhatsAppMessage(resident.whatsappNumber, message, apiKey, sender);
      if (result.success) sent++; else failed++;

      results.push({
        residentId: resident.id,
        residentName: resident.name,
        whatsappNumber: resident.whatsappNumber,
        success: result.success,
        message: result.success ? "Bill sent successfully" : (result.error ?? "Failed to send"),
      });
    }

    res.json({ sent, failed, results });
  } catch (err) {
    req.log.error({ err }, "Failed to send bills");
    res.status(500).json({ message: "Failed to send bills" });
  }
});

router.post("/whatsapp/send-reminder", async (req, res) => {
  try {
    const { residentId, month, year, customMessage } = SendReminderBody.parse(req.body);

    const bill = await getResidentBill(residentId, month, year);
    if (!bill) {
      return res.status(404).json({ message: "Resident not found" });
    }

    if (!bill.whatsappApiKey || !bill.whatsappSender) {
      return res.status(400).json({ message: "WhatsApp not configured. Please set your API key and sender number in Settings." });
    }

    const defaultMessage =
      `*Payment Reminder - ${bill.messName}*\n\nDear ${bill.resident.name},\n\n` +
      `This is a reminder that your mess bill for *${bill.monthName} ${year}* is:\n\n` +
      `*Total Due: ${bill.currency}${bill.totalAmount}*\n\nKindly make the payment at your earliest convenience. Thank you!`;

    const message = customMessage || defaultMessage;
    const result = await sendWhatsAppMessage(bill.resident.whatsappNumber, message, bill.whatsappApiKey, bill.whatsappSender);

    if (result.success) {
      res.json({ message: "Reminder sent successfully" });
    } else {
      res.status(502).json({ message: result.error ?? "Failed to send reminder" });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to send reminder");
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

export default router;
