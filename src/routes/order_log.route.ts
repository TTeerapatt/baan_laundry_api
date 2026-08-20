import { Router } from "express";
import { getOrderLogsController } from "../controllers/order_log.controller";

const orderLogRouter = Router();

orderLogRouter.get("/", getOrderLogsController);

export default orderLogRouter;
