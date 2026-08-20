import { Router } from "express";
import {
  createListPriceController,
  getListPriceByIdController,
  getListPricesController,
  hardDeleteListPriceController,
  softDeleteListPriceController,
  updateListPriceController,
} from "../controllers/list_price.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const listPriceRouter = Router();

listPriceRouter.post("/", authMiddleware, createListPriceController);
listPriceRouter.get("/", getListPricesController);
listPriceRouter.get("/:id", getListPriceByIdController);
listPriceRouter.put("/:id", authMiddleware, updateListPriceController);
listPriceRouter.delete("/:id/hard", authMiddleware, hardDeleteListPriceController);
listPriceRouter.delete("/:id", authMiddleware, softDeleteListPriceController);

export default listPriceRouter;
