import type { Request, Response, NextFunction } from "express";
import { getActiveListPrices } from "../services/list_price.service";

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
