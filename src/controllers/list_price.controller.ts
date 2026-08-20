import type { Request, Response, NextFunction } from "express";
import {
  getActiveListPriceById,
  getActiveListPrices,
} from "../services/list_price.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
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
