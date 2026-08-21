BEGIN;

INSERT INTO admin_menu_label (code, name, is_active, sort_order)
SELECT seed.code, seed.name, TRUE, seed.sort_order
FROM (
  VALUES
    ('dashboard', 'แดชบอร์ด', 1),
    ('management', 'การจัดการ', 2),
    ('activity-history', 'ประวัติการใช้งาน', 3)
) AS seed(code, name, sort_order)
WHERE NOT EXISTS (
  SELECT 1
  FROM admin_menu_label aml
  WHERE aml.code = seed.code
    AND aml.deleted_at IS NULL
);

INSERT INTO admin_menu_tab (menu_label_id, code, name, is_active, sort_order)
SELECT lbl.id, seed.code, seed.name, TRUE, seed.sort_order
FROM (
  VALUES
    ('dashboard', 'overview', 'ภาพรวม', 1),
    ('dashboard', 'bi', 'วิเคราะห์ BI', 2),
    ('management', 'customers', 'ลูกค้า', 1),
    ('management', 'service-types', 'ประเภทบริการ', 2),
    ('management', 'list-prices', 'ราคาบริการ', 3),
    ('management', 'admins', 'ผู้ดูแลระบบ', 4),
    ('activity-history', 'order_log', 'ประวัติออเดอร์', 1),
    ('activity-history', 'admin_log', 'ประวัติแอดมิน', 2)
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

COMMIT;
