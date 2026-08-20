import { Router } from "express";
import { getListTypesController } from "../controllers/list_type.controller";

const listTypeRouter = Router();

listTypeRouter.get("/", getListTypesController);

export default listTypeRouter;
