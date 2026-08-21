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
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/permission.middleware";

const ordersRouter = Router();

ordersRouter.post(
  "/",
  authMiddleware,
  requirePermission("orders", "add"),
  createOrderController
);
ordersRouter.get(
  "/",
  authMiddleware,
  requirePermission("orders", "view"),
  getOrdersController
);
ordersRouter.get(
  "/:id/logs",
  authMiddleware,
  requireAnyPermission([
    { tabCode: "orders", actionCode: "view" },
    { tabCode: "order_log", actionCode: "view" },
  ]),
  getOrderLogsController
);
ordersRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("orders", "view"),
  getOrderByIdController
);
ordersRouter.patch(
  "/:id/status",
  authMiddleware,
  requirePermission("orders", "edit"),
  updateOrderStatusController
);
ordersRouter.patch(
  "/:id/payment-status",
  authMiddleware,
  requirePermission("orders", "edit"),
  updateOrderPaymentStatusController
);
ordersRouter.put(
  "/:id",
  authMiddleware,
  requirePermission("orders", "edit"),
  updateOrderController
);
ordersRouter.delete(
  "/:id/hard",
  authMiddleware,
  requirePermission("orders", "delete"),
  hardDeleteOrderController
);
ordersRouter.delete(
  "/:id",
  authMiddleware,
  requirePermission("orders", "delete"),
  softDeleteOrderController
);

export default ordersRouter;
