import pool from "../config/database.config";

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

export async function getActiveOrderLogs(): Promise<OrderLogListItem[]> {
  const query = `
    SELECT
      id, order_id, admin_id, from_status, to_status,
      action, message, created_at, updated_at
    FROM order_log
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<OrderLogListItem>(query);
  return result.rows;
}

export async function getActiveOrderLogById(
  id: number
): Promise<OrderLogListItem | null> {
  const query = `
    SELECT
      id, order_id, admin_id, from_status, to_status,
      action, message, created_at, updated_at
    FROM order_log
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<OrderLogListItem>(query, [id]);
  return result.rows[0] ?? null;
}
