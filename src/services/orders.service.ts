import pool from "../config/database.config";

export interface OrderListItem {
  id: number;
  ticket_no: string;
  user_id: number;
  admin_id: number | null;
  status: string;
  subtotal: string;
  discount: string;
  total: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function getActiveOrders(): Promise<OrderListItem[]> {
  const query = `
    SELECT
      id, ticket_no, user_id, admin_id, status,
      subtotal, discount, total, note, created_at, updated_at
    FROM orders
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<OrderListItem>(query);
  return result.rows;
}

export async function getActiveOrderById(
  id: number
): Promise<OrderListItem | null> {
  const query = `
    SELECT
      id, ticket_no, user_id, admin_id, status,
      subtotal, discount, total, note, created_at, updated_at
    FROM orders
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<OrderListItem>(query, [id]);
  return result.rows[0] ?? null;
}
