import pool from "../config/database.config";
import {
  OrderError,
  insertOrderLog,
  recalcOrderTotals,
  resolveOrderItemPrice,
  type CreateOrderItemInput,
} from "./orders.service";

export interface OrderItemListItem {
  id: number;
  order_id: number;
  service_type_id: number;
  list_type_id: number;
  list_price_id: number | null;
  qty: number;
  unit_price: string;
  line_total: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderItemStandaloneInput extends CreateOrderItemInput {
  order_id: number;
  adminId?: number | null;
}

export interface UpdateOrderItemInput {
  qty?: number;
  note?: string | null;
  list_price_id?: number;
  service_type_id?: number;
  list_type_id?: number;
  adminId?: number | null;
}

function parsePositiveId(value: unknown, field: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new OrderError(400, `${field} is invalid`);
  }
  return id;
}

function parseQty(value: unknown): number {
  const qty = Number(value);
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new OrderError(400, "qty must be an integer > 0");
  }
  return qty;
}

export async function getActiveOrderItems(): Promise<OrderItemListItem[]> {
  const result = await pool.query<OrderItemListItem>(
    `
      SELECT
        id, order_id, service_type_id, list_type_id, list_price_id,
        qty, unit_price, line_total, note, created_at, updated_at
      FROM order_items
      WHERE deleted_at IS NULL
      ORDER BY id DESC
    `
  );
  return result.rows;
}

export async function getActiveOrderItemById(
  id: number
): Promise<OrderItemListItem | null> {
  const result = await pool.query<OrderItemListItem>(
    `
      SELECT
        id, order_id, service_type_id, list_type_id, list_price_id,
        qty, unit_price, line_total, note, created_at, updated_at
      FROM order_items
      WHERE id = $1
        AND deleted_at IS NULL
    `,
    [id]
  );
  return result.rows[0] ?? null;
}

async function assertActiveOrder(orderId: number): Promise<void> {
  const result = await pool.query<{ id: number }>(
    `
      SELECT id
      FROM orders
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [orderId]
  );
  if (result.rows.length === 0) {
    throw new OrderError(400, "order_id not found");
  }
}

export async function createOrderItem(
  input: CreateOrderItemStandaloneInput
): Promise<OrderItemListItem> {
  const orderId = parsePositiveId(input.order_id, "order_id");
  const qty = parseQty(input.qty);
  const note = input.note?.trim() || null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assertActiveOrder(orderId);
    const price = await resolveOrderItemPrice(client, input);

    const inserted = await client.query<OrderItemListItem>(
      `
        INSERT INTO order_items (
          order_id, service_type_id, list_type_id, list_price_id,
          qty, unit_price, line_total, note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $5 * $6, $7)
        RETURNING
          id, order_id, service_type_id, list_type_id, list_price_id,
          qty, unit_price, line_total, note, created_at, updated_at
      `,
      [
        orderId,
        price.service_type_id,
        price.list_type_id,
        price.list_price_id,
        qty,
        price.unit_price,
        note,
      ]
    );

    await recalcOrderTotals(client, orderId);
    await insertOrderLog(client, {
      orderId,
      adminId: input.adminId ?? null,
      action: "item_add",
      message: `Added order item ${inserted.rows[0].id}`,
    });

    await client.query("COMMIT");
    return inserted.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOrderItem(
  id: number,
  input: UpdateOrderItemInput
): Promise<OrderItemListItem> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query<OrderItemListItem>(
      `
        SELECT
          id, order_id, service_type_id, list_type_id, list_price_id,
          qty, unit_price, line_total, note, created_at, updated_at
        FROM order_items
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id]
    );
    const item = existing.rows[0];
    if (!item) {
      throw new OrderError(404, "Order item not found");
    }

    const nextQty =
      input.qty !== undefined ? parseQty(input.qty) : Number(item.qty);
    const nextNote =
      input.note !== undefined
        ? input.note === null || String(input.note).trim() === ""
          ? null
          : String(input.note).trim()
        : item.note;

    let price = {
      service_type_id: Number(item.service_type_id),
      list_type_id: Number(item.list_type_id),
      list_price_id: item.list_price_id ? Number(item.list_price_id) : 0,
      unit_price: Number(item.unit_price),
    };

    if (
      input.list_price_id !== undefined ||
      input.service_type_id !== undefined ||
      input.list_type_id !== undefined
    ) {
      price = await resolveOrderItemPrice(client, {
        list_price_id: input.list_price_id,
        service_type_id: input.service_type_id ?? price.service_type_id,
        list_type_id: input.list_type_id ?? price.list_type_id,
        qty: nextQty,
      });
    }

    const updated = await client.query<OrderItemListItem>(
      `
        UPDATE order_items
        SET service_type_id = $1,
            list_type_id = $2,
            list_price_id = $3,
            qty = $4,
            unit_price = $5,
            line_total = $4 * $5,
            note = $6
        WHERE id = $7
          AND deleted_at IS NULL
        RETURNING
          id, order_id, service_type_id, list_type_id, list_price_id,
          qty, unit_price, line_total, note, created_at, updated_at
      `,
      [
        price.service_type_id,
        price.list_type_id,
        price.list_price_id,
        nextQty,
        price.unit_price,
        nextNote,
        id,
      ]
    );

    await recalcOrderTotals(client, Number(item.order_id));
    await insertOrderLog(client, {
      orderId: Number(item.order_id),
      adminId: input.adminId ?? null,
      action: "item_update",
      message: `Updated order item ${id}`,
    });

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteOrderItem(
  id: number,
  adminId?: number | null
): Promise<OrderItemListItem> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updated = await client.query<OrderItemListItem>(
      `
        UPDATE order_items
        SET deleted_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING
          id, order_id, service_type_id, list_type_id, list_price_id,
          qty, unit_price, line_total, note, created_at, updated_at
      `,
      [id]
    );
    if (updated.rows.length === 0) {
      throw new OrderError(404, "Order item not found");
    }

    await recalcOrderTotals(client, Number(updated.rows[0].order_id));
    await insertOrderLog(client, {
      orderId: Number(updated.rows[0].order_id),
      adminId: adminId ?? null,
      action: "item_delete",
      message: `Soft deleted order item ${id}`,
    });

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function hardDeleteOrderItem(
  id: number,
  adminId?: number | null
): Promise<{ id: number }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const found = await client.query<{ id: number; order_id: number }>(
      `SELECT id, order_id FROM order_items WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (found.rows.length === 0) {
      throw new OrderError(404, "Order item not found");
    }

    const orderId = Number(found.rows[0].order_id);
    await client.query(`DELETE FROM order_items WHERE id = $1`, [id]);
    await recalcOrderTotals(client, orderId);
    await insertOrderLog(client, {
      orderId,
      adminId: adminId ?? null,
      action: "item_hard_delete",
      message: `Hard deleted order item ${id}`,
    });

    await client.query("COMMIT");
    return { id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
