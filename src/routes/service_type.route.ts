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

const serviceTypeRouter = Router();

serviceTypeRouter.post("/", authMiddleware, createServiceTypeController);
serviceTypeRouter.get("/", authMiddleware, getServiceTypesController);
serviceTypeRouter.get("/:id", authMiddleware, getServiceTypeByIdController);
serviceTypeRouter.put("/:id", authMiddleware, updateServiceTypeController);
serviceTypeRouter.delete(
  "/:id/hard",
  authMiddleware,
  hardDeleteServiceTypeController
);
serviceTypeRouter.delete(
  "/:id",
  authMiddleware,
  softDeleteServiceTypeController
);

export default serviceTypeRouter;
