import { Router } from "express";
import {
  createListTypeController,
  getListTypeByIdController,
  getListTypesController,
  hardDeleteListTypeController,
  softDeleteListTypeController,
  updateListTypeController,
} from "../controllers/list_type.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";

const listTypeRouter = Router();

listTypeRouter.post(
  "/",
  authMiddleware,
  requirePermission("list-prices", "add"),
  createListTypeController
);
listTypeRouter.get(
  "/",
  authMiddleware,
  requirePermission("list-prices", "view"),
  getListTypesController
);
listTypeRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("list-prices", "view"),
  getListTypeByIdController
);
listTypeRouter.put(
  "/:id",
  authMiddleware,
  requirePermission("list-prices", "edit"),
  updateListTypeController
);
listTypeRouter.delete(
  "/:id/hard",
  authMiddleware,
  requirePermission("list-prices", "delete"),
  hardDeleteListTypeController
);
listTypeRouter.delete(
  "/:id",
  authMiddleware,
  requirePermission("list-prices", "delete"),
  softDeleteListTypeController
);

export default listTypeRouter;
