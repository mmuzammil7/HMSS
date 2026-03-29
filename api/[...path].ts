import type { VercelRequest, VercelResponse } from "@vercel/node"
import app from "../artifacts/api-server/src/app"
import { runMigrations } from "../artifacts/api-server/src/migrate"

let migrationsDone = false
let migrationsPromise: Promise<void> | null = null

function ensureMigrated(): Promise<void> {
  if (migrationsDone) return Promise.resolve()
  if (!migrationsPromise) {
    migrationsPromise = runMigrations().then(() => {
      migrationsDone = true
    })
  }
  return migrationsPromise
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureMigrated()
  app(req as any, res as any)
}
