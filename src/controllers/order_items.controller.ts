import type { Request, Response, NextFunction } from "express";
import {
  getActiveOrderItemById,
  getActiveOrderItems,
} from "../services/order_items.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

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

export async function getOrderItemByIdController(
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

    const orderItem = await getActiveOrderItemById(id);
    if (!orderItem) {
      res.status(404).json({
        success: false,
        message: "Order item not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: orderItem,
    });
  } catch (error) {
    next(error);
  }
}
