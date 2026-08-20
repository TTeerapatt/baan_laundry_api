import pool from "../config/database.config";

export interface AdminListItem {
  id: number;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export async function getActiveAdmins(): Promise<AdminListItem[]> {
  const query = `
    SELECT id, email, display_name, role, created_at, updated_at
    FROM admins
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<AdminListItem>(query);
  return result.rows;
}
