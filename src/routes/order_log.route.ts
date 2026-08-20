import { Router } from "express";
import {
  createOrderLogController,
  getOrderLogByIdController,
  getOrderLogsController,
} from "../controllers/order_log.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const orderLogRouter = Router();

// append-only: create (note) + read เท่านั้น ไม่มี update/delete จาก API
orderLogRouter.post("/", authMiddleware, createOrderLogController);
orderLogRouter.get("/", authMiddleware, getOrderLogsController);
orderLogRouter.get("/:id", authMiddleware, getOrderLogByIdController);

export default orderLogRouter;
