import { pool } from "@workspace/db";
import { logger } from "./lib/logger";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    logger.info("Running startup migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS residents (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        room_number TEXT NOT NULL,
        whatsapp_number TEXT NOT NULL DEFAULT '',
        diet_type TEXT NOT NULL DEFAULT 'veg'
          CHECK (diet_type IN ('veg', 'non-veg')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        has_unpaid_bill BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mess_settings (
        id SERIAL PRIMARY KEY,
        mess_name TEXT NOT NULL DEFAULT 'Hostel Mess',
        veg_diet_rate NUMERIC(10,2) NOT NULL DEFAULT 100,
        non_veg_diet_rate NUMERIC(10,2) NOT NULL DEFAULT 120,
        breakfast_rate NUMERIC(10,2) NOT NULL DEFAULT 30,
        currency TEXT NOT NULL DEFAULT '₹',
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      INSERT INTO mess_settings (id)
      VALUES (1)
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        resident_id INTEGER NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('present', 'half', 'absent', 'breakfast')),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS attendance_resident_date_unique
      ON attendance(resident_id, date)
    `);

    logger.info("Migrations complete.");
  } catch (err) {
    logger.error({ err }, "Migration failed");
    throw err;
  } finally {
    client.release();
  }
}
