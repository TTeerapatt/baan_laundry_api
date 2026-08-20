import pool from "../config/database.config";

export interface ServiceTypeListItem {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function getActiveServiceTypes(): Promise<ServiceTypeListItem[]> {
  const query = `
    SELECT id, code, name, created_at, updated_at
    FROM service_type
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<ServiceTypeListItem>(query);
  return result.rows;
}

export async function getActiveServiceTypeById(
  id: number
): Promise<ServiceTypeListItem | null> {
  const query = `
    SELECT id, code, name, created_at, updated_at
    FROM service_type
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<ServiceTypeListItem>(query, [id]);
  return result.rows[0] ?? null;
}
