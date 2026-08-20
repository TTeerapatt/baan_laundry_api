import pool from "../config/database.config";

export interface ListPriceListItem {
  id: number;
  service_type_id: number;
  list_type_id: number;
  unit_price: string;
  created_at: string;
  updated_at: string;
}

export async function getActiveListPrices(): Promise<ListPriceListItem[]> {
  const query = `
    SELECT id, service_type_id, list_type_id, unit_price, created_at, updated_at
    FROM list_price
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<ListPriceListItem>(query);
  return result.rows;
}

export async function getActiveListPriceById(
  id: number
): Promise<ListPriceListItem | null> {
  const query = `
    SELECT id, service_type_id, list_type_id, unit_price, created_at, updated_at
    FROM list_price
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<ListPriceListItem>(query, [id]);
  return result.rows[0] ?? null;
}
