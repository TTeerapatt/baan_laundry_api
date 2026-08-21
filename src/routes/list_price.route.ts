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
import { requirePermission } from "../middleware/permission.middleware";

const listPriceRouter = Router();

listPriceRouter.post(
  "/",
  authMiddleware,
  requirePermission("list-prices", "add"),
  createListPriceController
);
listPriceRouter.get(
  "/",
  authMiddleware,
  requirePermission("list-prices", "view"),
  getListPricesController
);
listPriceRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("list-prices", "view"),
  getListPriceByIdController
);
listPriceRouter.put(
  "/:id",
  authMiddleware,
  requirePermission("list-prices", "edit"),
  updateListPriceController
);
listPriceRouter.delete(
  "/:id/hard",
  authMiddleware,
  requirePermission("list-prices", "delete"),
  hardDeleteListPriceController
);
listPriceRouter.delete(
  "/:id",
  authMiddleware,
  requirePermission("list-prices", "delete"),
  softDeleteListPriceController
);

export default listPriceRouter;
