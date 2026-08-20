import pool from "../config/database.config";
import { OrderError } from "./orders.service";

export interface OrderLogListItem {
  id: number;
  order_id: number;
  admin_id: number | null;
  from_status: string | null;
  to_status: string | null;
  action: string;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderLogInput {
  order_id: number;
  action: string;
  from_status?: string | null;
  to_status?: string | null;
  message?: string | null;
  adminId?: number | null;
}

function parsePositiveId(value: unknown, field: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new OrderError(400, `${field} is invalid`);
  }
  return id;
}

export async function getActiveOrderLogs(): Promise<OrderLogListItem[]> {
  const result = await pool.query<OrderLogListItem>(
    `
      SELECT
        id, order_id, admin_id, from_status, to_status,
        action, message, created_at, updated_at
      FROM order_log
      WHERE deleted_at IS NULL
      ORDER BY id DESC
    `
  );
  return result.rows;
}

export async function getActiveOrderLogById(
  id: number
): Promise<OrderLogListItem | null> {
  const result = await pool.query<OrderLogListItem>(
    `
      SELECT
        id, order_id, admin_id, from_status, to_status,
        action, message, created_at, updated_at
      FROM order_log
      WHERE id = $1
        AND deleted_at IS NULL
    `,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getOrderLogsByOrderId(
  orderId: number
): Promise<OrderLogListItem[]> {
  const id = parsePositiveId(orderId, "order_id");
  const result = await pool.query<OrderLogListItem>(
    `
      SELECT
        id, order_id, admin_id, from_status, to_status,
        action, message, created_at, updated_at
      FROM order_log
      WHERE order_id = $1
        AND deleted_at IS NULL
      ORDER BY id ASC
    `,
    [id]
  );
  return result.rows;
}

export async function createOrderLog(
  input: CreateOrderLogInput
): Promise<OrderLogListItem> {
  const orderId = parsePositiveId(input.order_id, "order_id");
  const action = (input.action || "").trim();
  if (!action) {
    throw new OrderError(400, "action is required");
  }

  const order = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM orders
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [orderId]
  );
  if (order.rows.length === 0) {
    throw new OrderError(400, "order_id not found");
  }

  const result = await pool.query<OrderLogListItem>(
    `
      INSERT INTO order_log (
        order_id, admin_id, from_status, to_status, action, message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id, order_id, admin_id, from_status, to_status,
        action, message, created_at, updated_at
    `,
    [
      orderId,
      input.adminId ?? null,
      input.from_status ?? null,
      input.to_status ?? null,
      action,
      input.message?.trim() || null,
    ]
  );

  return result.rows[0];
}
