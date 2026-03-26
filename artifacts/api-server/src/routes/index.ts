import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import residentsRouter from "./residents";
import attendanceRouter from "./attendance";
import settingsRouter from "./settings";
import billingRouter from "./billing";
import whatsappRouter from "./whatsapp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(residentsRouter);
router.use(attendanceRouter);
router.use(settingsRouter);
router.use(billingRouter);
router.use(whatsappRouter);

export default router;
