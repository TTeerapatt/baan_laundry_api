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

export interface UpdateOrderLogInput {
  action?: string;
  from_status?: string | null;
  to_status?: string | null;
  message?: string | null;
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

export async function updateOrderLog(
  id: number,
  input: UpdateOrderLogInput
): Promise<OrderLogListItem> {
  const existing = await getActiveOrderLogById(id);
  if (!existing) {
    throw new OrderError(404, "Order log not found");
  }

  const nextAction =
    input.action !== undefined ? input.action.trim() : existing.action;
  const nextFrom =
    input.from_status !== undefined ? input.from_status : existing.from_status;
  const nextTo =
    input.to_status !== undefined ? input.to_status : existing.to_status;
  const nextMessage =
    input.message !== undefined
      ? input.message === null || String(input.message).trim() === ""
        ? null
        : String(input.message).trim()
      : existing.message;

  if (!nextAction) {
    throw new OrderError(400, "action is required");
  }

  const result = await pool.query<OrderLogListItem>(
    `
      UPDATE order_log
      SET action = $1,
          from_status = $2,
          to_status = $3,
          message = $4
      WHERE id = $5
        AND deleted_at IS NULL
      RETURNING
        id, order_id, admin_id, from_status, to_status,
        action, message, created_at, updated_at
    `,
    [nextAction, nextFrom, nextTo, nextMessage, id]
  );

  return result.rows[0];
}

export async function softDeleteOrderLog(
  id: number
): Promise<OrderLogListItem> {
  const result = await pool.query<OrderLogListItem>(
    `
      UPDATE order_log
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING
        id, order_id, admin_id, from_status, to_status,
        action, message, created_at, updated_at
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new OrderError(404, "Order log not found");
  }
  return result.rows[0];
}

export async function hardDeleteOrderLog(id: number): Promise<{ id: number }> {
  const found = await pool.query<{ id: number }>(
    `SELECT id FROM order_log WHERE id = $1 LIMIT 1`,
    [id]
  );
  if (found.rows.length === 0) {
    throw new OrderError(404, "Order log not found");
  }
  await pool.query(`DELETE FROM order_log WHERE id = $1`, [id]);
  return { id };
}
