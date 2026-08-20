import { Router } from "express";
import {
  getOrderLogByIdController,
  getOrderLogsController,
} from "../controllers/order_log.controller";

const orderLogRouter = Router();

orderLogRouter.get("/", getOrderLogsController);
orderLogRouter.get("/:id", getOrderLogByIdController);

export default orderLogRouter;
