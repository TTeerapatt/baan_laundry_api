BEGIN;

INSERT INTO list_price (service_type_id, list_type_id, unit_price)
SELECT st.id, lt.id, seed.unit_price
FROM (
  VALUES
    ('clothes_normal', 'wash', 7.00),
    ('clothes_normal', 'wash_iron', 15.00),
    ('clothes_large', 'wash', 10.00),
    ('clothes_large', 'wash_iron', 20.00),
    ('duvet_normal', 'wash', 100.00),
    ('duvet_normal', 'wash_iron', 200.00),
    ('duvet_large', 'wash', 150.00),
    ('duvet_large', 'wash_iron', 250.00),
    ('underwear_normal', 'wash', 5.00),
    ('underwear_normal', 'wash_iron', 10.00),
    ('suit_normal', 'wash', 25.00),
    ('suit_normal', 'wash_iron', 50.00),
    ('suit_large', 'wash', 35.00),
    ('suit_large', 'wash_iron', 70.00)
) AS seed(list_type_code, service_type_code, unit_price)
JOIN list_type lt
  ON lt.code = seed.list_type_code
 AND lt.deleted_at IS NULL
JOIN service_type st
  ON st.code = seed.service_type_code
 AND st.deleted_at IS NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM list_price lp
  WHERE lp.service_type_id = st.id
    AND lp.list_type_id = lt.id
    AND lp.deleted_at IS NULL
);

COMMIT;
