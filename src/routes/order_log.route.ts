import { Router } from "express";
import {
  createOrderLogController,
  getOrderLogByIdController,
  getOrderLogsController,
  hardDeleteOrderLogController,
  softDeleteOrderLogController,
  updateOrderLogController,
} from "../controllers/order_log.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const orderLogRouter = Router();

orderLogRouter.post("/", authMiddleware, createOrderLogController);
orderLogRouter.get("/", getOrderLogsController);
orderLogRouter.get("/:id", getOrderLogByIdController);
orderLogRouter.put("/:id", authMiddleware, updateOrderLogController);
orderLogRouter.delete("/:id/hard", authMiddleware, hardDeleteOrderLogController);
orderLogRouter.delete("/:id", authMiddleware, softDeleteOrderLogController);

export default orderLogRouter;
