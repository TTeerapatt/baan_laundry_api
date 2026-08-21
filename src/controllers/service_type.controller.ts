import type { Request, Response, NextFunction } from "express";
import {
  ServiceTypeError,
  createServiceType,
  getActiveServiceTypeById,
  getActiveServiceTypes,
  hardDeleteServiceType,
  softDeleteServiceType,
  updateServiceType,
} from "../services/service_type.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function handleServiceTypeError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ServiceTypeError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }
  next(error);
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

export async function createServiceTypeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const serviceType = await createServiceType({
      code: req.body?.code,
      name: req.body?.name,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(201).json({
      success: true,
      data: serviceType,
    });
  } catch (error) {
    handleServiceTypeError(error, res, next);
  }
}

export async function updateServiceTypeController(
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

    const serviceType = await updateServiceType(id, {
      code: req.body?.code,
      name: req.body?.name,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(200).json({
      success: true,
      data: serviceType,
    });
  } catch (error) {
    handleServiceTypeError(error, res, next);
  }
}

export async function softDeleteServiceTypeController(
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

    const serviceType = await softDeleteServiceType(
      id,
      req.admin?.adminId ?? null
    );
    res.status(200).json({
      success: true,
      message: "Service type soft deleted",
      data: serviceType,
    });
  } catch (error) {
    handleServiceTypeError(error, res, next);
  }
}

export async function hardDeleteServiceTypeController(
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

    const result = await hardDeleteServiceType(
      id,
      req.admin?.adminId ?? null
    );
    res.status(200).json({
      success: true,
      message: "Service type hard deleted",
      data: result,
    });
  } catch (error) {
    handleServiceTypeError(error, res, next);
  }
}
