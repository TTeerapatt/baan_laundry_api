import { Router } from "express";
import {
  getListTypeByIdController,
  getListTypesController,
} from "../controllers/list_type.controller";

const listTypeRouter = Router();

listTypeRouter.get("/", getListTypesController);
listTypeRouter.get("/:id", getListTypeByIdController);

export default listTypeRouter;
