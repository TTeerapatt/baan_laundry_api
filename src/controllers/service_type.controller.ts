import type { Request, Response, NextFunction } from "express";
import { getActiveServiceTypes } from "../services/service_type.service";

export async function getServiceTypesController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const serviceTypes = await getActiveServiceTypes();
    res.status(200).json({
      success: true,
      data: serviceTypes,
    });
  } catch (error) {
    next(error);
  }
}
