import type { Request, Response, NextFunction } from "express";
import {
  ListPriceError,
  createListPrice,
  getActiveListPriceById,
  getActiveListPrices,
  hardDeleteListPrice,
  softDeleteListPrice,
  updateListPrice,
} from "../services/list_price.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function handleListPriceError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ListPriceError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }
  next(error);
}

export async function getListPricesController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const listPrices = await getActiveListPrices();
    res.status(200).json({
      success: true,
      data: listPrices,
    });
  } catch (error) {
    next(error);
  }
}

export async function getListPriceByIdController(
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

    const listPrice = await getActiveListPriceById(id);
    if (!listPrice) {
      res.status(404).json({
        success: false,
        message: "List price not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: listPrice,
    });
  } catch (error) {
    next(error);
  }
}

export async function createListPriceController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const listPrice = await createListPrice({
      service_type_id: req.body?.service_type_id,
      list_type_id: req.body?.list_type_id,
      unit_price: req.body?.unit_price,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(201).json({
      success: true,
      data: listPrice,
    });
  } catch (error) {
    handleListPriceError(error, res, next);
  }
}

export async function updateListPriceController(
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

    const listPrice = await updateListPrice(id, {
      service_type_id: req.body?.service_type_id,
      list_type_id: req.body?.list_type_id,
      unit_price: req.body?.unit_price,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(200).json({
      success: true,
      data: listPrice,
    });
  } catch (error) {
    handleListPriceError(error, res, next);
  }
}

export async function softDeleteListPriceController(
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

    const listPrice = await softDeleteListPrice(
      id,
      req.admin?.adminId ?? null
    );
    res.status(200).json({
      success: true,
      message: "List price soft deleted",
      data: listPrice,
    });
  } catch (error) {
    handleListPriceError(error, res, next);
  }
}

export async function hardDeleteListPriceController(
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

    const result = await hardDeleteListPrice(id, req.admin?.adminId ?? null);
    res.status(200).json({
      success: true,
      message: "List price hard deleted",
      data: result,
    });
  } catch (error) {
    handleListPriceError(error, res, next);
  }
}
