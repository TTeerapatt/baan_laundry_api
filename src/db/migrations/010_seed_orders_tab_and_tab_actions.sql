BEGIN;

-- orders tab (สำหรับ API orders / order-items)
INSERT INTO admin_menu_tab (menu_label_id, code, name, is_active, sort_order)
SELECT lbl.id, seed.code, seed.name, TRUE, seed.sort_order
FROM (
  VALUES
    ('management', 'orders', 'ออเดอร์', 0)
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

-- mapping tab → actions ที่รองรับ
INSERT INTO admin_menu_tab_action (menu_tab_id, permission_action_id)
SELECT mt.id, pa.id
FROM (
  VALUES
    -- dashboard
    ('overview', 'view'),
    ('bi', 'view'),
    -- management
    ('orders', 'view'),
    ('orders', 'add'),
    ('orders', 'edit'),
    ('orders', 'delete'),
    ('orders', 'export'),
    ('customers', 'view'),
    ('customers', 'add'),
    ('customers', 'edit'),
    ('customers', 'delete'),
    ('customers', 'export'),
    ('service-types', 'view'),
    ('service-types', 'add'),
    ('service-types', 'edit'),
    ('service-types', 'delete'),
    ('service-types', 'export'),
    ('list-prices', 'view'),
    ('list-prices', 'add'),
    ('list-prices', 'edit'),
    ('list-prices', 'delete'),
    ('list-prices', 'export'),
    ('admins', 'view'),
    ('admins', 'add'),
    ('admins', 'edit'),
    ('admins', 'delete'),
    ('admins', 'export'),
    -- activity history
    ('order_log', 'view'),
    ('order_log', 'add'),
    ('admin_log', 'view')
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

COMMIT;
