import pool from "../config/database.config";

export interface ListTypeListItem {
  id: number;
  code: string;
  name: string;
  size: string;
  created_at: string;
  updated_at: string;
}

export async function getActiveListTypes(): Promise<ListTypeListItem[]> {
  const query = `
    SELECT id, code, name, size, created_at, updated_at
    FROM list_type
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<ListTypeListItem>(query);
  return result.rows;
}
