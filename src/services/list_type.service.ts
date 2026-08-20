import pool from "../config/database.config";

export interface ListTypeListItem {
  id: number;
  code: string;
  name: string;
  size: string;
  created_at: string;
  updated_at: string;
}

export interface CreateListTypeInput {
  code: string;
  name: string;
  size: string;
}

export interface UpdateListTypeInput {
  code?: string;
  name?: string;
  size?: string;
}

export class ListTypeError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ListTypeError";
  }
}

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

function normalizeSize(size: string): string {
  return size.trim().toLowerCase();
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

export async function getActiveListTypeById(
  id: number
): Promise<ListTypeListItem | null> {
  const query = `
    SELECT id, code, name, size, created_at, updated_at
    FROM list_type
    WHERE id = $1
      AND deleted_at IS NULL
  `;

  const result = await pool.query<ListTypeListItem>(query, [id]);
  return result.rows[0] ?? null;
}

async function assertUniqueListType(
  code: string,
  name: string,
  size: string,
  excludeId?: number
): Promise<void> {
  const duplicateCode = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM list_type
      WHERE code = $1
        AND deleted_at IS NULL
        AND ($2::bigint IS NULL OR id <> $2)
      LIMIT 1
    `,
    [code, excludeId ?? null]
  );
  if (duplicateCode.rows.length > 0) {
    throw new ListTypeError(409, "Code already exists");
  }

  const duplicatePair = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM list_type
      WHERE name = $1
        AND size = $2
        AND deleted_at IS NULL
        AND ($3::bigint IS NULL OR id <> $3)
      LIMIT 1
    `,
    [name, size, excludeId ?? null]
  );
  if (duplicatePair.rows.length > 0) {
    throw new ListTypeError(409, "Name and size already exist");
  }
}

export async function createListType(
  input: CreateListTypeInput
): Promise<ListTypeListItem> {
  const code = normalizeCode(input.code || "");
  const name = (input.name || "").trim();
  const size = normalizeSize(input.size || "");

  if (!code) {
    throw new ListTypeError(400, "code is required");
  }
  if (!name) {
    throw new ListTypeError(400, "name is required");
  }
  if (!size) {
    throw new ListTypeError(400, "size is required");
  }

  await assertUniqueListType(code, name, size);

  const result = await pool.query<ListTypeListItem>(
    `
      INSERT INTO list_type (code, name, size)
      VALUES ($1, $2, $3)
      RETURNING id, code, name, size, created_at, updated_at
    `,
    [code, name, size]
  );

  return result.rows[0];
}

export async function updateListType(
  id: number,
  input: UpdateListTypeInput
): Promise<ListTypeListItem> {
  const existing = await getActiveListTypeById(id);
  if (!existing) {
    throw new ListTypeError(404, "List type not found");
  }

  const nextCode =
    input.code !== undefined ? normalizeCode(input.code) : existing.code;
  const nextName =
    input.name !== undefined ? input.name.trim() : existing.name;
  const nextSize =
    input.size !== undefined ? normalizeSize(input.size) : existing.size;

  if (input.code !== undefined && !nextCode) {
    throw new ListTypeError(400, "code is required");
  }
  if (input.name !== undefined && !nextName) {
    throw new ListTypeError(400, "name is required");
  }
  if (input.size !== undefined && !nextSize) {
    throw new ListTypeError(400, "size is required");
  }

  await assertUniqueListType(nextCode, nextName, nextSize, id);

  const result = await pool.query<ListTypeListItem>(
    `
      UPDATE list_type
      SET code = $1,
          name = $2,
          size = $3
      WHERE id = $4
        AND deleted_at IS NULL
      RETURNING id, code, name, size, created_at, updated_at
    `,
    [nextCode, nextName, nextSize, id]
  );

  return result.rows[0];
}

export async function softDeleteListType(
  id: number
): Promise<ListTypeListItem> {
  const result = await pool.query<ListTypeListItem>(
    `
      UPDATE list_type
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, code, name, size, created_at, updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ListTypeError(404, "List type not found");
  }

  return result.rows[0];
}

export async function hardDeleteListType(
  id: number
): Promise<{ id: number }> {
  const found = await pool.query<{ id: number }>(
    `SELECT id FROM list_type WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (found.rows.length === 0) {
    throw new ListTypeError(404, "List type not found");
  }

  const relatedPrice = await pool.query<{ id: number }>(
    `SELECT id FROM list_price WHERE list_type_id = $1 LIMIT 1`,
    [id]
  );
  if (relatedPrice.rows.length > 0) {
    throw new ListTypeError(
      409,
      "Cannot hard delete list type because list prices still exist"
    );
  }

  const relatedItems = await pool.query<{ id: number }>(
    `SELECT id FROM order_items WHERE list_type_id = $1 LIMIT 1`,
    [id]
  );
  if (relatedItems.rows.length > 0) {
    throw new ListTypeError(
      409,
      "Cannot hard delete list type because order items still exist"
    );
  }

  await pool.query(`DELETE FROM list_type WHERE id = $1`, [id]);
  return { id };
}
