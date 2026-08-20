import type { Request, Response, NextFunction } from "express";
import { getActiveListTypes } from "../services/list_type.service";

export async function getListTypesController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const listTypes = await getActiveListTypes();
    res.status(200).json({
      success: true,
      data: listTypes,
    });
  } catch (error) {
    next(error);
  }
}
