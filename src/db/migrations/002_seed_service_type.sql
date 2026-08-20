BEGIN;

INSERT INTO service_type (code, name)
SELECT seed.code, seed.name
FROM (
  VALUES
    ('wash', 'ซัก'),
    ('wash_iron', 'ซักรีด')
) AS seed(code, name)
WHERE NOT EXISTS (
  SELECT 1
  FROM service_type st
  WHERE st.code = seed.code
    AND st.deleted_at IS NULL
);

COMMIT;
