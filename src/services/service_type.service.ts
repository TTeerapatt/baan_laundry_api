import pool from "../config/database.config";
import { insertAdminLog } from "./admin_log.service";

export interface ServiceTypeListItem {
  id: number;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceTypeInput {
  code: string;
  name: string;
  adminId?: number | null;
}

export interface UpdateServiceTypeInput {
  code?: string;
  name?: string;
  adminId?: number | null;
}

export class ServiceTypeError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ServiceTypeError";
  }
}

function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
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

export async function createServiceType(
  input: CreateServiceTypeInput
): Promise<ServiceTypeListItem> {
  const code = normalizeCode(input.code || "");
  const name = (input.name || "").trim();

  if (!code) {
    throw new ServiceTypeError(400, "code is required");
  }
  if (!name) {
    throw new ServiceTypeError(400, "name is required");
  }

  const duplicate = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM service_type
      WHERE code = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [code]
  );

  if (duplicate.rows.length > 0) {
    throw new ServiceTypeError(409, "Code already exists");
  }

  const result = await pool.query<ServiceTypeListItem>(
    `
      INSERT INTO service_type (code, name)
      VALUES ($1, $2)
      RETURNING id, code, name, created_at, updated_at
    `,
    [code, name]
  );

  const serviceType = result.rows[0];
  await insertAdminLog({
    adminId: input.adminId,
    action: "create",
    entityType: "service_type",
    entityId: Number(serviceType.id),
    message: `Created service type ${serviceType.id}`,
  });

  return serviceType;
}

export async function updateServiceType(
  id: number,
  input: UpdateServiceTypeInput
): Promise<ServiceTypeListItem> {
  const existing = await getActiveServiceTypeById(id);
  if (!existing) {
    throw new ServiceTypeError(404, "Service type not found");
  }

  const nextCode =
    input.code !== undefined ? normalizeCode(input.code) : existing.code;
  const nextName =
    input.name !== undefined ? input.name.trim() : existing.name;

  if (input.code !== undefined && !nextCode) {
    throw new ServiceTypeError(400, "code is required");
  }
  if (input.name !== undefined && !nextName) {
    throw new ServiceTypeError(400, "name is required");
  }

  if (nextCode !== existing.code) {
    const duplicate = await pool.query<{ id: number }>(
      `
        SELECT id
        FROM service_type
        WHERE code = $1
          AND id <> $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [nextCode, id]
    );
    if (duplicate.rows.length > 0) {
      throw new ServiceTypeError(409, "Code already exists");
    }
  }

  const result = await pool.query<ServiceTypeListItem>(
    `
      UPDATE service_type
      SET code = $1,
          name = $2
      WHERE id = $3
        AND deleted_at IS NULL
      RETURNING id, code, name, created_at, updated_at
    `,
    [nextCode, nextName, id]
  );

  await insertAdminLog({
    adminId: input.adminId,
    action: "update",
    entityType: "service_type",
    entityId: id,
    message: `Updated service type ${id}`,
  });

  return result.rows[0];
}

export async function softDeleteServiceType(
  id: number,
  adminId?: number | null
): Promise<ServiceTypeListItem> {
  const result = await pool.query<ServiceTypeListItem>(
    `
      UPDATE service_type
      SET deleted_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, code, name, created_at, updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ServiceTypeError(404, "Service type not found");
  }

  await insertAdminLog({
    adminId,
    action: "soft_delete",
    entityType: "service_type",
    entityId: id,
    message: `Soft deleted service type ${id}`,
  });

  return result.rows[0];
}

export async function hardDeleteServiceType(
  id: number,
  adminId?: number | null
): Promise<{ id: number }> {
  const found = await pool.query<{ id: number }>(
    `SELECT id FROM service_type WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (found.rows.length === 0) {
    throw new ServiceTypeError(404, "Service type not found");
  }

  const relatedPrice = await pool.query<{ id: number }>(
    `SELECT id FROM list_price WHERE service_type_id = $1 LIMIT 1`,
    [id]
  );
  if (relatedPrice.rows.length > 0) {
    throw new ServiceTypeError(
      409,
      "Cannot hard delete service type because list prices still exist"
    );
  }

  const relatedItems = await pool.query<{ id: number }>(
    `SELECT id FROM order_items WHERE service_type_id = $1 LIMIT 1`,
    [id]
  );
  if (relatedItems.rows.length > 0) {
    throw new ServiceTypeError(
      409,
      "Cannot hard delete service type because order items still exist"
    );
  }

  await pool.query(`DELETE FROM service_type WHERE id = $1`, [id]);

  await insertAdminLog({
    adminId,
    action: "hard_delete",
    entityType: "service_type",
    entityId: id,
    message: `Hard deleted service type ${id}`,
  });

  return { id };
}
