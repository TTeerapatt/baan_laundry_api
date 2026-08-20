import { Router } from "express";
import { getServiceTypesController } from "../controllers/service_type.controller";

const serviceTypeRouter = Router();

serviceTypeRouter.get("/", getServiceTypesController);

export default serviceTypeRouter;
