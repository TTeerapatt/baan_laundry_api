import type { Request, Response, NextFunction } from "express";
import {
  getActiveServiceTypeById,
  getActiveServiceTypes,
} from "../services/service_type.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

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

export async function getServiceTypeByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid id",
      });
      return;
    }

    const serviceType = await getActiveServiceTypeById(id);
    if (!serviceType) {
      res.status(404).json({
        success: false,
        message: "Service type not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: serviceType,
    });
  } catch (error) {
    next(error);
  }
}
