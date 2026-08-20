import { Router } from "express";
import {
  getServiceTypeByIdController,
  getServiceTypesController,
} from "../controllers/service_type.controller";

const serviceTypeRouter = Router();

serviceTypeRouter.get("/", getServiceTypesController);
serviceTypeRouter.get("/:id", getServiceTypeByIdController);

export default serviceTypeRouter;
