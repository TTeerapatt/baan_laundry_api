import { Router } from "express";
import {
  getOrderByIdController,
  getOrdersController,
} from "../controllers/orders.controller";

const ordersRouter = Router();

ordersRouter.get("/", getOrdersController);
ordersRouter.get("/:id", getOrderByIdController);

export default ordersRouter;
