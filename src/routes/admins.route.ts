import { Router } from "express";
import { getAdminsController } from "../controllers/admins.controller";

const adminsRouter = Router();

adminsRouter.get("/", getAdminsController);

export default adminsRouter;
