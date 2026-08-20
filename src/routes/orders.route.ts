import { Router } from "express";
import {
  createOrderController,
  getOrderByIdController,
  getOrdersController,
  hardDeleteOrderController,
  softDeleteOrderController,
  updateOrderController,
} from "../controllers/orders.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const ordersRouter = Router();

ordersRouter.post("/", authMiddleware, createOrderController);
ordersRouter.get("/", getOrdersController);
ordersRouter.get("/:id", getOrderByIdController);
ordersRouter.put("/:id", authMiddleware, updateOrderController);
ordersRouter.delete("/:id/hard", authMiddleware, hardDeleteOrderController);
ordersRouter.delete("/:id", authMiddleware, softDeleteOrderController);

export default ordersRouter;
