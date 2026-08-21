import pool from "../config/database.config";
import { insertAdminLog } from "./admin_log.service";

export interface ListPriceListItem {
  id: number;
  service_type_id: number;
  list_type_id: number;
  unit_price: string;
  created_at: string;
  updated_at: string;
}

export interface CreateListPriceInput {
  service_type_id: number;
  list_type_id: number;
  unit_price: number;
  adminId?: number | null;
}

export interface UpdateListPriceInput {
  service_type_id?: number;
  list_type_id?: number;
  unit_price?: number;
  adminId?: number | null;
}

export class ListPriceError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ListPriceError";
  }
}

function parsePositiveId(value: unknown, field: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ListPriceError(400, `${field} is invalid`);
  }
  return id;
}

function parseUnitPrice(value: unknown): number {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new ListPriceError(400, "unit_price must be a number >= 0");
  }
  return price;
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

async function assertActiveServiceType(id: number): Promise<void> {
  const result = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM service_type
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new ListPriceError(400, "service_type_id not found");
  }
}

async function assertActiveListType(id: number): Promise<void> {
  const result = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM list_type
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [id]
  );
  if (result.rows.length === 0) {
    throw new ListPriceError(400, "list_type_id not found");
  }
}

async function assertUniquePair(
  serviceTypeId: number,
  listTypeId: number,
  excludeId?: number
): Promise<void> {
  const result = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM list_price
      WHERE service_type_id = $1
        AND list_type_id = $2
        AND deleted_at IS NULL
        AND ($3::bigint IS NULL OR id <> $3)
      LIMIT 1
    `,
    [serviceTypeId, listTypeId, excludeId ?? null]
  );
  if (result.rows.length > 0) {
    throw new ListPriceError(
      409,
      "Price for this service type and list type already exists"
    );
  }
}

export async function createListPrice(
  input: CreateListPriceInput
): Promise<ListPriceListItem> {
  const serviceTypeId = parsePositiveId(input.service_type_id, "service_type_id");
  const listTypeId = parsePositiveId(input.list_type_id, "list_type_id");
  const unitPrice = parseUnitPrice(input.unit_price);

  await assertActiveServiceType(serviceTypeId);
  await assertActiveListType(listTypeId);
  await assertUniquePair(serviceTypeId, listTypeId);

  const result = await pool.query<ListPriceListItem>(
    `
      INSERT INTO list_price (service_type_id, list_type_id, unit_price)
      VALUES ($1, $2, $3)
      RETURNING id, service_type_id, list_type_id, unit_price, created_at, updated_at
    `,
    [serviceTypeId, listTypeId, unitPrice]
  );

  const listPrice = result.rows[0];
  await insertAdminLog({
    adminId: input.adminId,
    action: "create",
    entityType: "list_price",
    entityId: Number(listPrice.id),
    message: `Created list price ${listPrice.id}`,
  });

  return listPrice;
}

export async function updateListPrice(
  id: number,
  input: UpdateListPriceInput
): Promise<ListPriceListItem> {
  const existing = await getActiveListPriceById(id);
  if (!existing) {
    throw new ListPriceError(404, "List price not found");
  }

  const nextServiceTypeId =
    input.service_type_id !== undefined
      ? parsePositiveId(input.service_type_id, "service_type_id")
      : Number(existing.service_type_id);
  const nextListTypeId =
    input.list_type_id !== undefined
      ? parsePositiveId(input.list_type_id, "list_type_id")
      : Number(existing.list_type_id);
  const nextUnitPrice =
    input.unit_price !== undefined
      ? parseUnitPrice(input.unit_price)
      : Number(existing.unit_price);

  await assertActiveServiceType(nextServiceTypeId);
  await assertActiveListType(nextListTypeId);
  await assertUniquePair(nextServiceTypeId, nextListTypeId, id);

  const result = await pool.query<ListPriceListItem>(
    `
      UPDATE list_price
      SET service_type_id = $1,
          list_type_id = $2,
          unit_price = $3
      WHERE id = $4
        AND deleted_at IS NULL
      RETURNING id, service_type_id, list_type_id, unit_price, created_at, updated_at
    `,
    [nextServiceTypeId, nextListTypeId, nextUnitPrice, id]
  );

  await insertAdminLog({
    adminId: input.adminId,
    action: "update",
    entityType: "list_price",
    entityId: id,
    message: `Updated list price ${id}`,
  });

  return result.rows[0];
}

export async function softDeleteListPrice(
  id: number,
  adminId?: number | null
): Promise<ListPriceListItem> {
  const result = await pool.query<ListPriceListItem>(
    `
      UPDATE list_price
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, service_type_id, list_type_id, unit_price, created_at, updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ListPriceError(404, "List price not found");
  }

  await insertAdminLog({
    adminId,
    action: "soft_delete",
    entityType: "list_price",
    entityId: id,
    message: `Soft deleted list price ${id}`,
  });

  return result.rows[0];
}

export async function hardDeleteListPrice(
  id: number,
  adminId?: number | null
): Promise<{ id: number }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const found = await client.query<{ id: number }>(
      `SELECT id FROM list_price WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (found.rows.length === 0) {
      throw new ListPriceError(404, "List price not found");
    }

    await client.query(
      `UPDATE order_items SET list_price_id = NULL WHERE list_price_id = $1`,
      [id]
    );
    await client.query(`DELETE FROM list_price WHERE id = $1`, [id]);

    await insertAdminLog(
      {
        adminId,
        action: "hard_delete",
        entityType: "list_price",
        entityId: id,
        message: `Hard deleted list price ${id}`,
      },
      client
    );

    await client.query("COMMIT");
    return { id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
