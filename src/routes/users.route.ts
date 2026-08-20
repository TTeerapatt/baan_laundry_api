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

const usersRouter = Router();

usersRouter.post("/", authMiddleware, createUserController);
usersRouter.get("/", getUsersController);
usersRouter.get("/:id", getUserByIdController);
usersRouter.put("/:id", authMiddleware, updateUserController);
usersRouter.delete("/:id/hard", authMiddleware, hardDeleteUserController);
usersRouter.delete("/:id", authMiddleware, softDeleteUserController);

export default usersRouter;
