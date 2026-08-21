import pool from "../config/database.config";
import { insertAdminLog } from "./admin_log.service";

export interface UserListItem {
  id: number;
  phone: string;
  name: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  phone: string;
  name: string;
  note?: string;
  adminId?: number | null;
}

export class UserError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "UserError";
  }
}

export interface ListUsersFilter {
  phone?: string;
}

export async function getActiveUsers(
  filter: ListUsersFilter = {}
): Promise<UserListItem[]> {
  const conditions: string[] = ["deleted_at IS NULL"];
  const params: unknown[] = [];

  const phone = filter.phone?.trim();
  if (phone) {
    params.push(phone);
    conditions.push(`phone = $${params.length}`);
  }

  const result = await pool.query<UserListItem>(
    `
      SELECT id, phone, name, note, created_at, updated_at
      FROM users
      WHERE ${conditions.join(" AND ")}
      ORDER BY id DESC
    `,
    params
  );
  return result.rows;
}

export async function getActiveUserByPhone(
  phone: string
): Promise<UserListItem | null> {
  const normalized = (phone || "").trim();
  if (!normalized) {
    throw new UserError(400, "phone is required");
  }

  const result = await pool.query<UserListItem>(
    `
      SELECT id, phone, name, note, created_at, updated_at
      FROM users
      WHERE phone = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [normalized]
  );
  return result.rows[0] ?? null;
}

export async function getActiveUserById(
  id: number
): Promise<UserListItem | null> {
  const query = `
    SELECT id, phone, name, note, created_at, updated_at
    FROM users
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<UserListItem>(query, [id]);
  return result.rows[0] ?? null;
}

export async function createUser(input: CreateUserInput): Promise<UserListItem> {
  const phone = (input.phone || "").trim();
  const name = (input.name || "").trim();
  const note = input.note?.trim() || null;

  if (!phone) {
    throw new UserError(400, "phone is required");
  }
  if (!name) {
    throw new UserError(400, "name is required");
  }

  const duplicate = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM users
      WHERE phone = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [phone]
  );

  if (duplicate.rows.length > 0) {
    throw new UserError(409, "Phone already exists");
  }

  const result = await pool.query<UserListItem>(
    `
      INSERT INTO users (phone, name, note)
      VALUES ($1, $2, $3)
      RETURNING id, phone, name, note, created_at, updated_at
    `,
    [phone, name, note]
  );

  const user = result.rows[0];
  await insertAdminLog({
    adminId: input.adminId,
    action: "create",
    entityType: "user",
    entityId: Number(user.id),
    message: `Created user ${user.id}`,
  });

  return user;
}

export interface UpdateUserInput {
  phone?: string;
  name?: string;
  note?: string | null;
  adminId?: number | null;
}

export async function updateUser(
  id: number,
  input: UpdateUserInput
): Promise<UserListItem> {
  const existing = await getActiveUserById(id);
  if (!existing) {
    throw new UserError(404, "User not found");
  }

  const nextPhone =
    input.phone !== undefined ? input.phone.trim() : existing.phone;
  const nextName =
    input.name !== undefined ? input.name.trim() : existing.name;
  const nextNote =
    input.note !== undefined
      ? input.note === null || String(input.note).trim() === ""
        ? null
        : String(input.note).trim()
      : existing.note;

  if (input.phone !== undefined && !nextPhone) {
    throw new UserError(400, "phone is required");
  }
  if (input.name !== undefined && !nextName) {
    throw new UserError(400, "name is required");
  }

  if (nextPhone !== existing.phone) {
    const duplicate = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM users
        WHERE phone = $1
          AND id <> $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [nextPhone, id]
    );
    if (duplicate.rows.length > 0) {
      throw new UserError(409, "Phone already exists");
    }
  }

  const result = await pool.query<UserListItem>(
    `
      UPDATE users
      SET phone = $1,
          name = $2,
          note = $3
      WHERE id = $4
        AND deleted_at IS NULL
      RETURNING id, phone, name, note, created_at, updated_at
    `,
    [nextPhone, nextName, nextNote, id]
  );

  await insertAdminLog({
    adminId: input.adminId,
    action: "update",
    entityType: "user",
    entityId: id,
    message: `Updated user ${id}`,
  });

  return result.rows[0];
}

export async function softDeleteUser(
  id: number,
  adminId?: number | null
): Promise<UserListItem> {
  const result = await pool.query<UserListItem>(
    `
      UPDATE users
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, phone, name, note, created_at, updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new UserError(404, "User not found");
  }

  await insertAdminLog({
    adminId,
    action: "soft_delete",
    entityType: "user",
    entityId: id,
    message: `Soft deleted user ${id}`,
  });

  return result.rows[0];
}

export async function hardDeleteUser(
  id: number,
  adminId?: number | null
): Promise<{ id: number }> {
  const found = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (found.rows.length === 0) {
    throw new UserError(404, "User not found");
  }

  const relatedOrders = await pool.query<{ id: number }>(
    `SELECT id FROM orders WHERE user_id = $1 LIMIT 1`,
    [id]
  );

  if (relatedOrders.rows.length > 0) {
    throw new UserError(
      409,
      "Cannot hard delete user because orders still exist"
    );
  }

  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

  await insertAdminLog({
    adminId,
    action: "hard_delete",
    entityType: "user",
    entityId: id,
    message: `Hard deleted user ${id}`,
  });

  return { id };
}
