import { Router } from "express";
import {
  getAdminByIdController,
  getAdminsController,
  hardDeleteAdminController,
  softDeleteAdminController,
  updateAdminController,
} from "../controllers/admins.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const adminsRouter = Router();

adminsRouter.get("/", getAdminsController);
adminsRouter.get("/:id", getAdminByIdController);
adminsRouter.put("/:id", authMiddleware, updateAdminController);
adminsRouter.delete("/:id/hard", authMiddleware, hardDeleteAdminController);
adminsRouter.delete("/:id", authMiddleware, softDeleteAdminController);

export default adminsRouter;
