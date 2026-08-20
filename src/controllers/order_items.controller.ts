import type { Request, Response, NextFunction } from "express";
import { OrderError } from "../services/orders.service";
import {
  createOrderItem,
  getActiveOrderItemById,
  getActiveOrderItems,
  hardDeleteOrderItem,
  softDeleteOrderItem,
  updateOrderItem,
} from "../services/order_items.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function handleOrderError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof OrderError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }
  next(error);
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

export async function createOrderItemController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const item = await createOrderItem({
      order_id: req.body?.order_id,
      list_price_id: req.body?.list_price_id,
      service_type_id: req.body?.service_type_id,
      list_type_id: req.body?.list_type_id,
      qty: req.body?.qty,
      note: req.body?.note,
      adminId: req.admin?.adminId ?? null,
    });
    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function updateOrderItemController(
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

    const item = await updateOrderItem(id, {
      qty: req.body?.qty,
      note: req.body?.note,
      list_price_id: req.body?.list_price_id,
      service_type_id: req.body?.service_type_id,
      list_type_id: req.body?.list_type_id,
      adminId: req.admin?.adminId ?? null,
    });
    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function softDeleteOrderItemController(
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

    const item = await softDeleteOrderItem(id, req.admin?.adminId ?? null);
    res.status(200).json({
      success: true,
      message: "Order item soft deleted",
      data: item,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function hardDeleteOrderItemController(
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

    const result = await hardDeleteOrderItem(id, req.admin?.adminId ?? null);
    res.status(200).json({
      success: true,
      message: "Order item hard deleted",
      data: result,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}
