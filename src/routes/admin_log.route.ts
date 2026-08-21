import { Router } from "express";
import {
  getAdminLogByIdController,
  getAdminLogsController,
} from "../controllers/admin_log.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const adminLogRouter = Router();

// read-only — log ถูกสร้างจากระบบเท่านั้น
adminLogRouter.get("/", authMiddleware, getAdminLogsController);
adminLogRouter.get("/:id", authMiddleware, getAdminLogByIdController);

export default adminLogRouter;
