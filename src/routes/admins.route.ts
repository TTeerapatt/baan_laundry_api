import { Router } from "express";
import {
  createAdminController,
  getAdminByIdController,
  getAdminsController,
  getAdminPermissionsByIdController,
  hardDeleteAdminController,
  softDeleteAdminController,
  updateAdminController,
} from "../controllers/admins.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const adminsRouter = Router();

adminsRouter.post("/", authMiddleware, createAdminController);
adminsRouter.get("/", authMiddleware, getAdminsController);
adminsRouter.get("/:id", authMiddleware, getAdminByIdController);
adminsRouter.get("/:id/permissions", authMiddleware, getAdminPermissionsByIdController);
adminsRouter.put("/:id", authMiddleware, updateAdminController);
adminsRouter.delete("/:id/hard", authMiddleware, hardDeleteAdminController);
adminsRouter.delete("/:id", authMiddleware, softDeleteAdminController);

export default adminsRouter;
