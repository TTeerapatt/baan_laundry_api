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

const orderItemsRouter = Router();

orderItemsRouter.post("/", authMiddleware, createOrderItemController);
orderItemsRouter.get("/", getOrderItemsController);
orderItemsRouter.get("/:id", getOrderItemByIdController);
orderItemsRouter.put("/:id", authMiddleware, updateOrderItemController);
orderItemsRouter.delete("/:id/hard", authMiddleware, hardDeleteOrderItemController);
orderItemsRouter.delete("/:id", authMiddleware, softDeleteOrderItemController);

export default orderItemsRouter;
