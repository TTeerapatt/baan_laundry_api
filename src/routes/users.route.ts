import { Router } from "express";
import {
  createUserController,
  getUserByIdController,
  getUsersController,
  hardDeleteUserController,
  softDeleteUserController,
  updateUserController,
} from "../controllers/users.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/permission.middleware";

const usersRouter = Router();

usersRouter.post(
  "/",
  authMiddleware,
  requirePermission("customers", "add"),
  createUserController
);
usersRouter.get(
  "/",
  authMiddleware,
  requirePermission("customers", "view"),
  getUsersController
);
usersRouter.get(
  "/:id",
  authMiddleware,
  requirePermission("customers", "view"),
  getUserByIdController
);
usersRouter.put(
  "/:id",
  authMiddleware,
  requirePermission("customers", "edit"),
  updateUserController
);
usersRouter.delete(
  "/:id/hard",
  authMiddleware,
  requirePermission("customers", "delete"),
  hardDeleteUserController
);
usersRouter.delete(
  "/:id",
  authMiddleware,
  requirePermission("customers", "delete"),
  softDeleteUserController
);

export default usersRouter;
