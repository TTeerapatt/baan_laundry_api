import type { Request, Response, NextFunction } from "express";
import { getActiveOrders } from "../services/orders.service";

export async function getOrdersController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await getActiveOrders();
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
}
