import type { Request, Response, NextFunction } from "express";
import { getActiveUsers } from "../services/users.service";

export async function getUsersController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await getActiveUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}
