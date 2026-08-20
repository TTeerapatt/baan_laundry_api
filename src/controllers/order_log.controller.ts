import type { Request, Response, NextFunction } from "express";
import {
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
