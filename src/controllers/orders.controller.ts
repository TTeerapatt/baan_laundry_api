import type { Request, Response, NextFunction } from "express";
import {
  OrderError,
  assertActiveOrderExists,
  createOrder,
  getActiveOrderById,
  getActiveOrders,
  hardDeleteOrder,
  softDeleteOrder,
  updateOrder,
  updateOrderPaymentStatus,
  updateOrderStatus,
} from "../services/orders.service";
import { getOrderLogsByOrderId } from "../services/order_log.service";

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

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value[0] !== undefined ? String(value[0]) : undefined;
  }
  if (value === undefined || value === null) {
    return undefined;
  }
  return String(value);
}

export async function getOrdersController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await getActiveOrders({
      ticket_no: firstQueryValue(req.query.ticket_no),
      status: firstQueryValue(req.query.status),
      payment_status: firstQueryValue(req.query.payment_status),
      phone: firstQueryValue(req.query.phone),
      date_from: firstQueryValue(req.query.date_from),
      date_to: firstQueryValue(req.query.date_to),
    });
    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function getOrderByIdController(
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

    const order = await getActiveOrderById(id);
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderLogsController(
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

    await assertActiveOrderExists(id);
    const logs = await getOrderLogsByOrderId(id);
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function createOrderController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const order = await createOrder({
      user_id: req.body?.user_id,
      discount: req.body?.discount,
      note: req.body?.note,
      items: req.body?.items,
      adminId: req.admin?.adminId ?? null,
    });
    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function updateOrderController(
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

    const order = await updateOrder(id, {
      user_id: req.body?.user_id,
      status: req.body?.status,
      payment_status: req.body?.payment_status,
      discount: req.body?.discount,
      note: req.body?.note,
      adminId: req.admin?.adminId ?? null,
    });
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function updateOrderPaymentStatusController(
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

    const order = await updateOrderPaymentStatus(id, {
      payment_status: req.body?.payment_status,
      adminId: req.admin?.adminId ?? null,
    });
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function updateOrderStatusController(
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

    const order = await updateOrderStatus(id, {
      status: req.body?.status,
      adminId: req.admin?.adminId ?? null,
    });
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function softDeleteOrderController(
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

    const order = await softDeleteOrder(id);
    res.status(200).json({
      success: true,
      message: "Order soft deleted",
      data: order,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}

export async function hardDeleteOrderController(
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

    const result = await hardDeleteOrder(id);
    res.status(200).json({
      success: true,
      message: "Order hard deleted",
      data: result,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}
