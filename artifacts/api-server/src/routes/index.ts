import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import residentsRouter from "./residents.js";
import attendanceRouter from "./attendance.js";
import settingsRouter from "./settings.js";
import billingRouter from "./billing.js";
import authRouter from "./auth.js";
import { requireAuth } from "../middleware/auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireAuth);

router.use((req, res, next) => {
  const writeMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (writeMethods.includes(req.method) && req.user?.role === "resident") {
    res.status(403).json({ error: "Insufficient permissions" });
    return;
  }
  next();
});

router.use(residentsRouter);
router.use(attendanceRouter);
router.use(settingsRouter);
router.use(billingRouter);

export default router;
