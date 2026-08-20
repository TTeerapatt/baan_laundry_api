BEGIN;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32);

UPDATE orders
SET payment_status = 'unpaid'
WHERE payment_status IS NULL;

ALTER TABLE orders
ALTER COLUMN payment_status SET DEFAULT 'unpaid';

ALTER TABLE orders
ALTER COLUMN payment_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_payment_status_check'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('unpaid', 'paid'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS orders_payment_status_idx
  ON orders (payment_status)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN orders.payment_status IS
  'สถานะชำระเงิน: unpaid = ยังไม่จ่าย, paid = จ่ายแล้ว';

COMMIT;
