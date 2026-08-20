import { Router } from "express";
import { getOrderItemsController } from "../controllers/order_items.controller";

const orderItemsRouter = Router();

orderItemsRouter.get("/", getOrderItemsController);

export default orderItemsRouter;
