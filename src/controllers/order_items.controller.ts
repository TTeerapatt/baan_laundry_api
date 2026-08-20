import type { Request, Response, NextFunction } from "express";
import { getActiveOrderItems } from "../services/order_items.service";

export async function getOrderItemsController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orderItems = await getActiveOrderItems();
    res.status(200).json({
      success: true,
      data: orderItems,
    });
  } catch (error) {
    next(error);
  }
}
