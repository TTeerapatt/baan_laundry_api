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
  requirePermission("list-types", "add"),
  createListTypeController
);
listTypeRouter.get(
  "/",
  authMiddleware,
  requirePermission("list-types", "view"),
  getListTypesController
);
listTypeRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("list-types", "view"),
  getListTypeByIdController
);
listTypeRouter.put(
  "/:id",
  authMiddleware,
  requirePermission("list-types", "edit"),
  updateListTypeController
);
listTypeRouter.delete(
  "/:id/hard",
  authMiddleware,
  requirePermission("list-types", "delete"),
  hardDeleteListTypeController
);
listTypeRouter.delete(
  "/:id",
  authMiddleware,
  requirePermission("list-types", "delete"),
  softDeleteListTypeController
);

export default listTypeRouter;
