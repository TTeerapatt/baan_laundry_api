import type { Request, Response, NextFunction } from "express";
import { getActiveAdmins } from "../services/admins.service";

export async function getAdminsController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const admins = await getActiveAdmins();
    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    next(error);
  }
}
