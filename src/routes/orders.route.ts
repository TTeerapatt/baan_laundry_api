import { Router } from "express";
import {
  createOrderController,
  getOrderByIdController,
  getOrderLogsController,
  getOrdersController,
  hardDeleteOrderController,
  softDeleteOrderController,
  updateOrderController,
  updateOrderPaymentStatusController,
  updateOrderStatusController,
} from "../controllers/orders.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const ordersRouter = Router();

ordersRouter.post("/", authMiddleware, createOrderController);
ordersRouter.get("/", getOrdersController);
ordersRouter.get("/:id/logs", getOrderLogsController);
ordersRouter.get("/:id", getOrderByIdController);
ordersRouter.patch(
  "/:id/status",
  authMiddleware,
  updateOrderStatusController
);
ordersRouter.patch(
  "/:id/payment-status",
  authMiddleware,
  updateOrderPaymentStatusController
);
ordersRouter.put("/:id", authMiddleware, updateOrderController);
ordersRouter.delete("/:id/hard", authMiddleware, hardDeleteOrderController);
ordersRouter.delete("/:id", authMiddleware, softDeleteOrderController);

export default ordersRouter;
