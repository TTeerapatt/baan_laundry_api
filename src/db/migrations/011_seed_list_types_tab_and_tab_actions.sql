BEGIN;

-- จัดลำดับ tab ใหม่: list-types อยู่ก่อน list-prices
UPDATE admin_menu_tab
SET sort_order = 5,
    updated_at = NOW()
WHERE code = 'admins'
  AND deleted_at IS NULL
  AND sort_order < 5;

UPDATE admin_menu_tab
SET sort_order = 4,
    updated_at = NOW()
WHERE code = 'list-prices'
  AND deleted_at IS NULL
  AND sort_order < 4;

INSERT INTO admin_menu_tab (menu_label_id, code, name, is_active, sort_order)
SELECT lbl.id, seed.code, seed.name, TRUE, seed.sort_order
FROM (
  VALUES
    ('management', 'list-types', 'ประเภทรายการ', 3)
) AS seed(label_code, code, name, sort_order)
INNER JOIN admin_menu_label lbl
  ON lbl.code = seed.label_code
 AND lbl.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM admin_menu_tab amt
  WHERE amt.code = seed.code
    AND amt.deleted_at IS NULL
);

INSERT INTO admin_menu_tab_action (menu_tab_id, permission_action_id)
SELECT mt.id, pa.id
FROM (
  VALUES
    ('list-types', 'view'),
    ('list-types', 'add'),
    ('list-types', 'edit'),
    ('list-types', 'delete'),
    ('list-types', 'export')
) AS seed(tab_code, action_code)
INNER JOIN admin_menu_tab mt
  ON mt.code = seed.tab_code
 AND mt.deleted_at IS NULL
INNER JOIN admin_permission_action pa
  ON pa.code = seed.action_code
 AND pa.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM admin_menu_tab_action mta
  WHERE mta.menu_tab_id = mt.id
    AND mta.permission_action_id = pa.id
    AND mta.deleted_at IS NULL
);

-- คัดลอกสิทธิ์จาก list-prices ไป list-types ให้ admin ที่มีสิทธิ์เดิมอยู่แล้ว
INSERT INTO admin_permissions (admin_id, menu_tab_action_id, is_allowed)
SELECT
  ap.admin_id,
  new_mta.id,
  TRUE
FROM admin_permissions ap
INNER JOIN admin_menu_tab_action old_mta
  ON old_mta.id = ap.menu_tab_action_id
 AND old_mta.deleted_at IS NULL
INNER JOIN admin_menu_tab old_mt
  ON old_mt.id = old_mta.menu_tab_id
 AND old_mt.code = 'list-prices'
 AND old_mt.deleted_at IS NULL
INNER JOIN admin_permission_action pa
  ON pa.id = old_mta.permission_action_id
 AND pa.deleted_at IS NULL
INNER JOIN admin_menu_tab new_mt
  ON new_mt.code = 'list-types'
 AND new_mt.deleted_at IS NULL
INNER JOIN admin_menu_tab_action new_mta
  ON new_mta.menu_tab_id = new_mt.id
 AND new_mta.permission_action_id = pa.id
 AND new_mta.deleted_at IS NULL
WHERE ap.is_allowed = TRUE
  AND ap.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM admin_permissions existing
    WHERE existing.admin_id = ap.admin_id
      AND existing.menu_tab_action_id = new_mta.id
      AND existing.deleted_at IS NULL
  );

COMMIT;
