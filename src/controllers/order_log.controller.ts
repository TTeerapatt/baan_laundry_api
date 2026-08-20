import type { Request, Response, NextFunction } from "express";
import { getActiveOrderLogs } from "../services/order_log.service";

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
