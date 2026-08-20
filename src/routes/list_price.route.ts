import { Router } from "express";
import {
  getListPriceByIdController,
  getListPricesController,
} from "../controllers/list_price.controller";

const listPriceRouter = Router();

listPriceRouter.get("/", getListPricesController);
listPriceRouter.get("/:id", getListPriceByIdController);

export default listPriceRouter;
