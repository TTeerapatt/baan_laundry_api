import { Router } from "express";
import {
  getAdminByIdController,
  getAdminsController,
} from "../controllers/admins.controller";

const adminsRouter = Router();

adminsRouter.get("/", getAdminsController);
adminsRouter.get("/:id", getAdminByIdController);

export default adminsRouter;
