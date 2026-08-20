BEGIN;

INSERT INTO list_type (code, name, size)
SELECT seed.code, seed.name, seed.size
FROM (
  VALUES
    ('clothes_normal', 'เสื้อผ้า', 'normal'),
    ('clothes_large', 'เสื้อผ้า', 'large'),
    ('duvet_normal', 'ผ้านวม', 'normal'),
    ('duvet_large', 'ผ้านวม', 'large'),
    ('underwear_normal', 'ชุดชั้นใน', 'normal'),
    ('suit_normal', 'ชุดสูท', 'normal'),
    ('suit_large', 'ชุดสูท', 'large')
) AS seed(code, name, size)
WHERE NOT EXISTS (
  SELECT 1
  FROM list_type lt
  WHERE lt.code = seed.code
    AND lt.deleted_at IS NULL
);

COMMIT;
