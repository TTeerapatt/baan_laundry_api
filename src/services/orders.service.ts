import type { PoolClient } from "pg";
import pool from "../config/database.config";

export const ORDER_STATUSES = [
  "received",
  "processing",
  "ready",
  "completed",
  "cancelled",
] as const;

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderListItem {
  id: number;
  ticket_no: string;
  user_id: number;
  admin_id: number | null;
  status: string;
  payment_status: string;
  subtotal: string;
  discount: string;
  total: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface OrderDetail extends OrderListItem {
  items: OrderItemListItem[];
}

export interface CreateOrderItemInput {
  list_price_id?: number;
  service_type_id?: number;
  list_type_id?: number;
  qty: number;
  note?: string;
}

export interface CreateOrderInput {
  user_id: number;
  discount?: number;
  note?: string;
  items: CreateOrderItemInput[];
  adminId?: number | null;
}

export interface UpdateOrderInput {
  user_id?: number;
  status?: string;
  payment_status?: string;
  discount?: number;
  note?: string | null;
  adminId?: number | null;
}

export class OrderError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "OrderError";
  }
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

function parseMoney(value: unknown, field: string): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new OrderError(400, `${field} must be a number >= 0`);
  }
  return amount;
}

function generateTicketNo(): string {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const suffix = String(now.getTime()).slice(-6);
  return `BL-${y}${m}${d}-${suffix}`;
}

export async function insertOrderLog(
  client: PoolClient,
  input: {
    orderId: number;
    adminId?: number | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    action: string;
    message?: string | null;
  }
): Promise<void> {
  await client.query(
    `
      INSERT INTO order_log (
        order_id, admin_id, from_status, to_status, action, message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      input.orderId,
      input.adminId ?? null,
      input.fromStatus ?? null,
      input.toStatus ?? null,
      input.action,
      input.message ?? null,
    ]
  );
}

export async function recalcOrderTotals(
  client: PoolClient,
  orderId: number
): Promise<void> {
  await client.query(
    `
      UPDATE orders o
      SET
        subtotal = s.subtotal,
        discount = LEAST(o.discount, s.subtotal),
        total = s.subtotal - LEAST(o.discount, s.subtotal)
      FROM (
        SELECT COALESCE(SUM(line_total), 0) AS subtotal
        FROM order_items
        WHERE order_id = $1
          AND deleted_at IS NULL
      ) s
      WHERE o.id = $1
    `,
    [orderId]
  );
}

export async function resolveOrderItemPrice(
  client: PoolClient,
  input: CreateOrderItemInput
): Promise<{
  service_type_id: number;
  list_type_id: number;
  list_price_id: number;
  unit_price: number;
}> {
  if (input.list_price_id !== undefined) {
    const listPriceId = parsePositiveId(input.list_price_id, "list_price_id");
    const result = await client.query<{
      id: number;
      service_type_id: number;
      list_type_id: number;
      unit_price: string;
    }>(
      `
        SELECT id, service_type_id, list_type_id, unit_price
        FROM list_price
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [listPriceId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new OrderError(400, "list_price_id not found");
    }
    return {
      service_type_id: Number(row.service_type_id),
      list_type_id: Number(row.list_type_id),
      list_price_id: Number(row.id),
      unit_price: Number(row.unit_price),
    };
  }

  if (input.service_type_id !== undefined && input.list_type_id !== undefined) {
    const serviceTypeId = parsePositiveId(
      input.service_type_id,
      "service_type_id"
    );
    const listTypeId = parsePositiveId(input.list_type_id, "list_type_id");
    const result = await client.query<{
      id: number;
      service_type_id: number;
      list_type_id: number;
      unit_price: string;
    }>(
      `
        SELECT id, service_type_id, list_type_id, unit_price
        FROM list_price
        WHERE service_type_id = $1
          AND list_type_id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [serviceTypeId, listTypeId]
    );
    const row = result.rows[0];
    if (!row) {
      throw new OrderError(400, "Price not found for this service and list type");
    }
    return {
      service_type_id: Number(row.service_type_id),
      list_type_id: Number(row.list_type_id),
      list_price_id: Number(row.id),
      unit_price: Number(row.unit_price),
    };
  }

  throw new OrderError(
    400,
    "Each item requires list_price_id or service_type_id + list_type_id"
  );
}

async function getOrderItemsByOrderId(
  orderId: number,
  client?: PoolClient
): Promise<OrderItemListItem[]> {
  const db = client ?? pool;
  const result = await db.query<OrderItemListItem>(
    `
      SELECT
        id, order_id, service_type_id, list_type_id, list_price_id,
        qty, unit_price, line_total, note, created_at, updated_at
      FROM order_items
      WHERE order_id = $1
        AND deleted_at IS NULL
      ORDER BY id ASC
    `,
    [orderId]
  );
  return result.rows;
}

async function getOrderRow(
  id: number,
  client?: PoolClient
): Promise<OrderListItem | null> {
  const db = client ?? pool;
  const result = await db.query<OrderListItem>(
    `
      SELECT
        id, ticket_no, user_id, admin_id, status, payment_status,
        subtotal, discount, total, note, created_at, updated_at
      FROM orders
      WHERE id = $1
        AND deleted_at IS NULL
    `,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getActiveOrders(): Promise<OrderListItem[]> {
  const result = await pool.query<OrderListItem>(
    `
      SELECT
        id, ticket_no, user_id, admin_id, status, payment_status,
        subtotal, discount, total, note, created_at, updated_at
      FROM orders
      WHERE deleted_at IS NULL
      ORDER BY id DESC
    `
  );
  return result.rows;
}

export async function getActiveOrderById(
  id: number
): Promise<OrderDetail | null> {
  const order = await getOrderRow(id);
  if (!order) {
    return null;
  }
  const items = await getOrderItemsByOrderId(id);
  return { ...order, items };
}

async function assertActiveUser(client: PoolClient, userId: number): Promise<void> {
  const result = await client.query<{ id: number }>(
    `
      SELECT id
      FROM users
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );
  if (result.rows.length === 0) {
    throw new OrderError(400, "user_id not found");
  }
}

export async function createOrder(
  input: CreateOrderInput
): Promise<OrderDetail> {
  const userId = parsePositiveId(input.user_id, "user_id");
  const discount = parseMoney(input.discount ?? 0, "discount");
  const note = input.note?.trim() || null;
  const items = Array.isArray(input.items) ? input.items : [];

  if (items.length === 0) {
    throw new OrderError(400, "items is required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await assertActiveUser(client, userId);

    const orderResult = await client.query<OrderListItem>(
      `
        INSERT INTO orders (
          ticket_no, user_id, admin_id, status, payment_status,
          subtotal, discount, total, note
        )
        VALUES ($1, $2, $3, 'received', 'unpaid', 0, 0, 0, $4)
        RETURNING
          id, ticket_no, user_id, admin_id, status, payment_status,
          subtotal, discount, total, note, created_at, updated_at
      `,
      [generateTicketNo(), userId, input.adminId ?? null, note]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      const qty = parseQty(item.qty);
      const price = await resolveOrderItemPrice(client, item);
      const itemNote = item.note?.trim() || null;
      await client.query(
        `
          INSERT INTO order_items (
            order_id, service_type_id, list_type_id, list_price_id,
            qty, unit_price, line_total, note
          )
          VALUES ($1, $2, $3, $4, $5, $6, $5 * $6, $7)
        `,
        [
          order.id,
          price.service_type_id,
          price.list_type_id,
          price.list_price_id,
          qty,
          price.unit_price,
          itemNote,
        ]
      );
    }

    await recalcOrderTotals(client, Number(order.id));

    if (discount > 0) {
      await client.query(
        `
          UPDATE orders
          SET
            discount = LEAST($2::numeric, subtotal),
            total = subtotal - LEAST($2::numeric, subtotal)
          WHERE id = $1
        `,
        [order.id, discount]
      );
    }

    await insertOrderLog(client, {
      orderId: Number(order.id),
      adminId: input.adminId ?? null,
      fromStatus: null,
      toStatus: "received",
      action: "create",
      message: "Order created",
    });

    const saved = await getOrderRow(Number(order.id), client);
    const savedItems = await getOrderItemsByOrderId(Number(order.id), client);
    await client.query("COMMIT");
    return { ...(saved as OrderListItem), items: savedItems };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateOrder(
  id: number,
  input: UpdateOrderInput
): Promise<OrderDetail> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existing = await getOrderRow(id, client);
    if (!existing) {
      throw new OrderError(404, "Order not found");
    }

    const nextUserId =
      input.user_id !== undefined
        ? parsePositiveId(input.user_id, "user_id")
        : Number(existing.user_id);
    const nextStatus =
      input.status !== undefined ? String(input.status).trim() : existing.status;
    const nextPaymentStatus =
      input.payment_status !== undefined
        ? String(input.payment_status).trim()
        : existing.payment_status;
    const nextDiscount =
      input.discount !== undefined
        ? parseMoney(input.discount, "discount")
        : Number(existing.discount);
    const nextNote =
      input.note !== undefined
        ? input.note === null || String(input.note).trim() === ""
          ? null
          : String(input.note).trim()
        : existing.note;

    if (!ORDER_STATUSES.includes(nextStatus as OrderStatus)) {
      throw new OrderError(
        400,
        "status must be one of: received, processing, ready, completed, cancelled"
      );
    }
    if (!PAYMENT_STATUSES.includes(nextPaymentStatus as PaymentStatus)) {
      throw new OrderError(400, "payment_status must be one of: unpaid, paid");
    }

    await assertActiveUser(client, nextUserId);

    await client.query(
      `
        UPDATE orders
        SET user_id = $1,
            status = $2,
            payment_status = $3,
            note = $4
        WHERE id = $5
          AND deleted_at IS NULL
      `,
      [nextUserId, nextStatus, nextPaymentStatus, nextNote, id]
    );

    if (input.discount !== undefined) {
      await client.query(
        `
          UPDATE orders
          SET
            discount = LEAST($2::numeric, subtotal),
            total = subtotal - LEAST($2::numeric, subtotal)
          WHERE id = $1
            AND deleted_at IS NULL
        `,
        [id, nextDiscount]
      );
    }

    await recalcOrderTotals(client, id);

    if (nextStatus !== existing.status) {
      await insertOrderLog(client, {
        orderId: id,
        adminId: input.adminId ?? null,
        fromStatus: existing.status,
        toStatus: nextStatus,
        action: "status_change",
        message: `Status changed from ${existing.status} to ${nextStatus}`,
      });
    }
    if (nextPaymentStatus !== existing.payment_status) {
      await insertOrderLog(client, {
        orderId: id,
        adminId: input.adminId ?? null,
        fromStatus: existing.payment_status,
        toStatus: nextPaymentStatus,
        action: "payment_change",
        message: `Payment changed from ${existing.payment_status} to ${nextPaymentStatus}`,
      });
    }

    const saved = await getOrderRow(id, client);
    const savedItems = await getOrderItemsByOrderId(id, client);
    await client.query("COMMIT");
    return { ...(saved as OrderListItem), items: savedItems };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteOrder(id: number): Promise<OrderListItem> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updated = await client.query<OrderListItem>(
      `
        UPDATE orders
        SET deleted_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING
          id, ticket_no, user_id, admin_id, status, payment_status,
          subtotal, discount, total, note, created_at, updated_at
      `,
      [id]
    );
    if (updated.rows.length === 0) {
      throw new OrderError(404, "Order not found");
    }

    await client.query(
      `
        UPDATE order_items
        SET deleted_at = NOW()
        WHERE order_id = $1
          AND deleted_at IS NULL
      `,
      [id]
    );
    await client.query(
      `
        UPDATE order_log
        SET deleted_at = NOW()
        WHERE order_id = $1
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

export async function hardDeleteOrder(id: number): Promise<{ id: number }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const found = await client.query<{ id: number }>(
      `SELECT id FROM orders WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (found.rows.length === 0) {
      throw new OrderError(404, "Order not found");
    }

    await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);
    await client.query(`DELETE FROM order_log WHERE order_id = $1`, [id]);
    await client.query(`DELETE FROM orders WHERE id = $1`, [id]);

    await client.query("COMMIT");
    return { id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
