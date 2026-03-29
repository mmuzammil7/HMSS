import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db, usersTable, settingsTable } from "@workspace/db";
import { requireAuth, requireAdmin, signToken } from "../middleware/auth.js";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { role, username, password } = req.body as {
      role: string;
      username: string;
      password: string;
    };

    if (!role || !username || !password) {
      res.status(400).json({ error: "role, username, and password are required" });
      return;
    }

    if (role === "resident") {
      const rows = await db.select().from(settingsTable).limit(1);
      const settings = rows[0];
      if (!settings) {
        res.status(500).json({ error: "Settings not found" });
        return;
      }
      if (
        username !== settings.residentUsername ||
        password !== settings.residentPin
      ) {
        res.status(401).json({ error: "Invalid username or PIN" });
        return;
      }
      const token = signToken({ id: 0, username, role: "resident" });
      res.json({ token, role: "resident", username });
      return;
    }

    if (role !== "admin" && role !== "manager") {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const users = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.username, username), eq(usersTable.role, role)));

    const user = users[0];
    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role as "admin" | "manager" });
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.user);
});

router.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

router.get("/auth/managers", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const managers = await db
      .select({ id: usersTable.id, username: usersTable.username, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .where(eq(usersTable.role, "manager"));
    res.json(managers);
  } catch {
    res.status(500).json({ error: "Failed to fetch managers" });
  }
});

router.post("/auth/managers", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ error: "username and password are required" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(usersTable)
      .values({ username, passwordHash, role: "manager" })
      .returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role });
    res.status(201).json(created);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "23505") {
      res.status(409).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: "Failed to create manager" });
    }
  }
});

router.put("/auth/managers/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { username, password } = req.body as { username?: string; password?: string };
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (username) updates.username = username;
    if (password) updates.passwordHash = await bcrypt.hash(password, 10);
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(and(eq(usersTable.id, id), eq(usersTable.role, "manager")))
      .returning({ id: usersTable.id, username: usersTable.username, role: usersTable.role });
    if (!updated) {
      res.status(404).json({ error: "Manager not found" });
      return;
    }
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update manager" });
  }
});

router.delete("/auth/managers/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(usersTable).where(and(eq(usersTable.id, id), eq(usersTable.role, "manager")));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete manager" });
  }
});

router.put("/auth/resident-credentials", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, pin } = req.body as { username?: string; pin?: string };
    if (!username && !pin) {
      res.status(400).json({ error: "username or pin required" });
      return;
    }
    const updates: Record<string, string> = {};
    if (username) updates.residentUsername = username;
    if (pin) updates.residentPin = pin;
    await db.update(settingsTable).set(updates).where(eq(settingsTable.id, 1));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update resident credentials" });
  }
});

router.put("/auth/admin-password", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword and newPassword required" });
      return;
    }
    const users = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
    const user = users[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, req.user!.id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
