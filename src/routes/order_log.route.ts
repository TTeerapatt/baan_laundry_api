import { Router } from "express";
import {
  createOrderLogController,
  getOrderLogByIdController,
  getOrderLogsController,
} from "../controllers/order_log.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";

const orderLogRouter = Router();

// append-only: create (note) + read เท่านั้น ไม่มี update/delete จาก API
orderLogRouter.post(
  "/",
  authMiddleware,
  requirePermission("order_log", "add"),
  createOrderLogController
);
orderLogRouter.get(
  "/",
  authMiddleware,
  requirePermission("order_log", "view"),
  getOrderLogsController
);
orderLogRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("order_log", "view"),
  getOrderLogByIdController
);

export default orderLogRouter;
