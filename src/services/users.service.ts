import pool from "../config/database.config";

export interface UserListItem {
  id: number;
  phone: string;
  name: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export async function getActiveUsers(): Promise<UserListItem[]> {
  const query = `
    SELECT id, phone, name, note, created_at, updated_at
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY id DESC
  `;

  const result = await pool.query<UserListItem>(query);
  return result.rows;
}
