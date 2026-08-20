import { Router } from "express";
import { getListPricesController } from "../controllers/list_price.controller";

const listPriceRouter = Router();

listPriceRouter.get("/", getListPricesController);

export default listPriceRouter;
