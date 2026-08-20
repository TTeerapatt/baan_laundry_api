import bcrypt from "bcrypt";
import pool from "../config/database.config";

const BCRYPT_ROUNDS = 10;
const ALLOWED_ROLES = ["owner", "admin", "staff"] as const;

export interface AdminListItem {
  id: number;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateAdminInput {
  email?: string;
  display_name?: string;
  role?: string;
  password?: string;
}

export class AdminError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AdminError";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

export async function getActiveAdminById(
  id: number
): Promise<AdminListItem | null> {
  const query = `
    SELECT id, email, display_name, role, created_at, updated_at
    FROM admins
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<AdminListItem>(query, [id]);
  return result.rows[0] ?? null;
}

export async function updateAdmin(
  id: number,
  input: UpdateAdminInput
): Promise<AdminListItem> {
  const existing = await getActiveAdminById(id);
  if (!existing) {
    throw new AdminError(404, "Admin not found");
  }

  const nextEmail =
    input.email !== undefined ? normalizeEmail(input.email) : existing.email;
  const nextDisplayName =
    input.display_name !== undefined
      ? input.display_name.trim()
      : existing.display_name;
  const nextRole =
    input.role !== undefined ? input.role.trim() : existing.role;
  const nextPassword =
    input.password !== undefined ? input.password.trim() : undefined;

  if (input.email !== undefined && (!nextEmail || !isValidEmail(nextEmail))) {
    throw new AdminError(400, "Valid email is required");
  }
  if (input.display_name !== undefined && !nextDisplayName) {
    throw new AdminError(400, "display_name is required");
  }
  if (
    input.role !== undefined &&
    !ALLOWED_ROLES.includes(nextRole as (typeof ALLOWED_ROLES)[number])
  ) {
    throw new AdminError(400, "role must be one of: owner, admin, staff");
  }
  if (input.password !== undefined && (!nextPassword || nextPassword.length < 6)) {
    throw new AdminError(400, "Password must be at least 6 characters");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (nextEmail !== existing.email) {
      const duplicate = await client.query(
        `
          SELECT id
          FROM admins
          WHERE email = $1
            AND id <> $2
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [nextEmail, id]
      );
      if (duplicate.rows.length > 0) {
        throw new AdminError(409, "Email already exists");
      }
    }

    const updated = await client.query<AdminListItem>(
      `
        UPDATE admins
        SET email = $1,
            display_name = $2,
            role = $3
        WHERE id = $4
          AND deleted_at IS NULL
        RETURNING id, email, display_name, role, created_at, updated_at
      `,
      [nextEmail, nextDisplayName, nextRole, id]
    );

    if (nextPassword) {
      const passwordHash = await bcrypt.hash(nextPassword, BCRYPT_ROUNDS);
      await client.query(
        `
          UPDATE admin_auth
          SET password_hash = $1
          WHERE admin_id = $2
            AND deleted_at IS NULL
        `,
        [passwordHash, id]
      );
    }

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteAdmin(id: number): Promise<AdminListItem> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updated = await client.query<AdminListItem>(
      `
        UPDATE admins
        SET deleted_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING id, email, display_name, role, created_at, updated_at
      `,
      [id]
    );

    if (updated.rows.length === 0) {
      throw new AdminError(404, "Admin not found");
    }

    await client.query(
      `
        UPDATE admin_auth
        SET deleted_at = NOW()
        WHERE admin_id = $1
          AND deleted_at IS NULL
      `,
      [id]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function hardDeleteAdmin(id: number): Promise<{ id: number }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const found = await client.query<{ id: number }>(
      `SELECT id FROM admins WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (found.rows.length === 0) {
      throw new AdminError(404, "Admin not found");
    }

    await client.query(`DELETE FROM admin_auth WHERE admin_id = $1`, [id]);
    await client.query(
      `UPDATE orders SET admin_id = NULL WHERE admin_id = $1`,
      [id]
    );
    await client.query(
      `UPDATE order_log SET admin_id = NULL WHERE admin_id = $1`,
      [id]
    );
    await client.query(`DELETE FROM admins WHERE id = $1`, [id]);

    await client.query("COMMIT");
    return { id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
