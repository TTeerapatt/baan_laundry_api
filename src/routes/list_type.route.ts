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

const listTypeRouter = Router();

listTypeRouter.post("/", authMiddleware, createListTypeController);
listTypeRouter.get("/", getListTypesController);
listTypeRouter.get("/:id", getListTypeByIdController);
listTypeRouter.put("/:id", authMiddleware, updateListTypeController);
listTypeRouter.delete("/:id/hard", authMiddleware, hardDeleteListTypeController);
listTypeRouter.delete("/:id", authMiddleware, softDeleteListTypeController);

export default listTypeRouter;
