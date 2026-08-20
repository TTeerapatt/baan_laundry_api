import type { Request, Response, NextFunction } from "express";
import { OrderError } from "../services/orders.service";
import {
  createOrderLog,
  getActiveOrderLogById,
  getActiveOrderLogs,
} from "../services/order_log.service";

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

export async function getOrderLogsController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orderLogs = await getActiveOrderLogs();
    res.status(200).json({
      success: true,
      data: orderLogs,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderLogByIdController(
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

    const orderLog = await getActiveOrderLogById(id);
    if (!orderLog) {
      res.status(404).json({
        success: false,
        message: "Order log not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: orderLog,
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrderLogController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // API ภายนอก append ได้เฉพาะ note — status/payment change เกิดจากระบบเท่านั้น
    const action = String(req.body?.action ?? "note").trim() || "note";
    if (action !== "note") {
      res.status(400).json({
        success: false,
        message: "Only action \"note\" is allowed via API",
      });
      return;
    }

    const log = await createOrderLog({
      order_id: req.body?.order_id,
      action: "note",
      from_status: null,
      to_status: null,
      message: req.body?.message,
      adminId: req.admin?.adminId ?? null,
    });
    res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    handleOrderError(error, res, next);
  }
}
