import { Router } from "express";
import {
  getUserByIdController,
  getUsersController,
} from "../controllers/users.controller";

const usersRouter = Router();

usersRouter.get("/", getUsersController);
usersRouter.get("/:id", getUserByIdController);

export default usersRouter;
