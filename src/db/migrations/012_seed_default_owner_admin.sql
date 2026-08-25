BEGIN;

-- Default owner admin (มีสิทธิ์ทุก tab/action)
-- email: admin@baanlaundry.com
-- password: 123456
-- แนะนำให้เปลี่ยนรหัสผ่านหลัง login ครั้งแรก

INSERT INTO admins (email, display_name, role)
SELECT seed.email, seed.display_name, seed.role
FROM (
  VALUES
    ('admin@baanlaundry.com', 'Default Owner', 'owner')
) AS seed(email, display_name, role)
WHERE NOT EXISTS (
  SELECT 1
  FROM admins a
  WHERE a.email = seed.email
    AND a.deleted_at IS NULL
);

INSERT INTO admin_auth (admin_id, password_hash)
SELECT a.id, seed.password_hash
FROM (
  VALUES
    (
      'admin@baanlaundry.com',
      '$2b$10$UiStc/dDI9zwQjIxDW/j6.dTn46Anx4TbfGSDIconCAopiXBX7ES6'
    )
) AS seed(email, password_hash)
INNER JOIN admins a
  ON a.email = seed.email
 AND a.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM admin_auth aa
  WHERE aa.admin_id = a.id
    AND aa.deleted_at IS NULL
);

-- ให้ owner มีสิทธิ์ทุก menu_tab_action ที่ active ในระบบ
INSERT INTO admin_permissions (admin_id, menu_tab_action_id, is_allowed)
SELECT
  a.id,
  mta.id,
  TRUE
FROM admins a
CROSS JOIN admin_menu_tab_action mta
INNER JOIN admin_menu_tab mt
  ON mt.id = mta.menu_tab_id
 AND mt.deleted_at IS NULL
 AND mt.is_active = TRUE
INNER JOIN admin_menu_label ml
  ON ml.id = mt.menu_label_id
 AND ml.deleted_at IS NULL
 AND ml.is_active = TRUE
INNER JOIN admin_permission_action pa
  ON pa.id = mta.permission_action_id
 AND pa.deleted_at IS NULL
 AND pa.is_active = TRUE
WHERE a.email = 'admin@baanlaundry.com'
  AND a.deleted_at IS NULL
  AND mta.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM admin_permissions ap
    WHERE ap.admin_id = a.id
      AND ap.menu_tab_action_id = mta.id
      AND ap.deleted_at IS NULL
  );

COMMIT;
