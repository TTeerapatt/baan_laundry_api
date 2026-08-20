BEGIN;

ALTER TABLE list_type
ADD COLUMN IF NOT EXISTS code VARCHAR(64);

UPDATE list_type
SET code = CONCAT('lt_', id)
WHERE code IS NULL OR BTRIM(code) = '';

ALTER TABLE list_type
ALTER COLUMN code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS list_type_code_active_uidx
  ON list_type (code)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN list_type.code IS
  'รหัสสำหรับ logic — unique เฉพาะแถวที่ยังไม่ลบ';

COMMIT;
