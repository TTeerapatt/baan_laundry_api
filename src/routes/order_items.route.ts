import { Router } from "express";
import {
  getOrderItemByIdController,
  getOrderItemsController,
} from "../controllers/order_items.controller";

const orderItemsRouter = Router();

orderItemsRouter.get("/", getOrderItemsController);
orderItemsRouter.get("/:id", getOrderItemByIdController);

export default orderItemsRouter;
