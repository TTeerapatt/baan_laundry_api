import pool from "../config/database.config";

export interface OrderItemListItem {
  id: number;
  order_id: number;
  service_type_id: number;
  list_type_id: number;
  list_price_id: number | null;
  qty: number;
  unit_price: string;
  line_total: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function getActiveOrderItems(): Promise<OrderItemListItem[]> {
  const query = `
    SELECT
      id, order_id, service_type_id, list_type_id, list_price_id,
      qty, unit_price, line_total, note, created_at, updated_at
    FROM order_items
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<OrderItemListItem>(query);
  return result.rows;
}

export async function getActiveOrderItemById(
  id: number
): Promise<OrderItemListItem | null> {
  const query = `
    SELECT
      id, order_id, service_type_id, list_type_id, list_price_id,
      qty, unit_price, line_total, note, created_at, updated_at
    FROM order_items
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<OrderItemListItem>(query, [id]);
  return result.rows[0] ?? null;
}
