import { Router } from "express";
import {
  createOrderItemController,
  getOrderItemByIdController,
  getOrderItemsController,
  hardDeleteOrderItemController,
  softDeleteOrderItemController,
  updateOrderItemController,
} from "../controllers/order_items.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";

const orderItemsRouter = Router();

orderItemsRouter.post(
  "/",
  authMiddleware,
  requirePermission("orders", "add"),
  createOrderItemController
);
orderItemsRouter.get(
  "/",
  authMiddleware,
  requirePermission("orders", "view"),
  getOrderItemsController
);
orderItemsRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("orders", "view"),
  getOrderItemByIdController
);
orderItemsRouter.put(
  "/:id",
  authMiddleware,
  requirePermission("orders", "edit"),
  updateOrderItemController
);
orderItemsRouter.delete(
  "/:id/hard",
  authMiddleware,
  requirePermission("orders", "delete"),
  hardDeleteOrderItemController
);
orderItemsRouter.delete(
  "/:id",
  authMiddleware,
  requirePermission("orders", "delete"),
  softDeleteOrderItemController
);

export default orderItemsRouter;
