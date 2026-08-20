import { Router } from "express";
import { getOrdersController } from "../controllers/orders.controller";

const ordersRouter = Router();

ordersRouter.get("/", getOrdersController);

export default ordersRouter;
