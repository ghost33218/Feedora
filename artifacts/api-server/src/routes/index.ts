import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import foodPostsRouter from "./food-posts";
import ngosRouter from "./ngos";
import claimsRouter from "./claims";
import impactRouter from "./impact";
import volunteersRouter from "./volunteers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(foodPostsRouter);
router.use(ngosRouter);
router.use(claimsRouter);
router.use(impactRouter);
router.use(volunteersRouter);

export default router;
