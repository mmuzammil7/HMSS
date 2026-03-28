import { Router, type IRouter } from "express";
import healthRouter from "./health";
import residentsRouter from "./residents";
import attendanceRouter from "./attendance";
import settingsRouter from "./settings";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(residentsRouter);
router.use(attendanceRouter);
router.use(settingsRouter);
router.use(billingRouter);

export default router;
