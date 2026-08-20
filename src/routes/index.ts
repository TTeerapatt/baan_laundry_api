import { Router } from "express";
import usersRouter from "./users.route";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Laundry API is running",
  });
});

router.use("/users", usersRouter);

export default router;
