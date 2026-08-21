import { Router } from "express";
import {
  createServiceTypeController,
  getServiceTypeByIdController,
  getServiceTypesController,
  hardDeleteServiceTypeController,
  softDeleteServiceTypeController,
  updateServiceTypeController,
} from "../controllers/service_type.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";

const serviceTypeRouter = Router();

serviceTypeRouter.post(
  "/",
  authMiddleware,
  requirePermission("service-types", "add"),
  createServiceTypeController
);
serviceTypeRouter.get(
  "/",
  authMiddleware,
  requirePermission("service-types", "view"),
  getServiceTypesController
);
serviceTypeRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("service-types", "view"),
  getServiceTypeByIdController
);
serviceTypeRouter.put(
  "/:id",
  authMiddleware,
  requirePermission("service-types", "edit"),
  updateServiceTypeController
);
serviceTypeRouter.delete(
  "/:id/hard",
  authMiddleware,
  requirePermission("service-types", "delete"),
  hardDeleteServiceTypeController
);
serviceTypeRouter.delete(
  "/:id",
  authMiddleware,
  requirePermission("service-types", "delete"),
  softDeleteServiceTypeController
);

export default serviceTypeRouter;
