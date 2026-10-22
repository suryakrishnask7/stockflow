-- V3__seed_demo_data.sql
-- Realistic demo data for StockFlow
-- Provides 50+ products, 3 warehouses, 8 suppliers, 200+ stock movements
-- across multiple categories with a realistic mix of healthy/low/out-of-stock inventory.

-- ============================================================
-- WAREHOUSES
-- ============================================================
INSERT INTO warehouses (code, name, address_line1, city, state, postal_code, country, status) VALUES
    ('WH-EAST',  'East Coast Distribution Center', '100 Commerce Blvd',   'Newark',       'NJ', '07101', 'USA', 'ACTIVE'),
    ('WH-WEST',  'West Coast Fulfillment Hub',      '500 Pacific Ave',    'Los Angeles',   'CA', '90001', 'USA', 'ACTIVE'),
    ('WH-CENT',  'Central Distribution Hub',        '200 Midwest Pkwy',   'Chicago',       'IL', '60601', 'USA', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (name, description) VALUES
    ('Electronics',       'Consumer electronics and accessories'),
    ('Office Supplies',   'Stationery, paper products, and office equipment'),
    ('Industrial Tools',  'Power tools, hand tools, and industrial equipment'),
    ('Safety Equipment',  'PPE, fire safety, and workplace safety products'),
    ('Computer Hardware', 'Servers, networking, storage, and components'),
    ('Furniture',         'Office furniture and ergonomic accessories'),
    ('Packaging',         'Shipping boxes, tape, bubble wrap, and labels'),
    ('Cleaning Supplies', 'Janitorial and facility maintenance products')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SUPPLIERS
-- ============================================================
INSERT INTO suppliers (code, name, contact_person, email, phone, city, state, country, status) VALUES
    ('SUP-TECH1',  'TechCore Distributors',         'Sarah Chen',       'sarah.chen@techcore.example',       '+1-800-555-0100', 'San Jose',    'CA', 'USA', 'ACTIVE'),
    ('SUP-OFFX2',  'OfficeXpress Supply Co.',       'Marcus Rodriguez', 'marcus.r@officexpress.example',     '+1-800-555-0200', 'Atlanta',     'GA', 'USA', 'ACTIVE'),
    ('SUP-TOOL3',  'ProIndustrial Tools Ltd.',       'Linda Park',       'l.park@proindustrial.example',      '+1-800-555-0300', 'Detroit',     'MI', 'USA', 'ACTIVE'),
    ('SUP-SAFE4',  'SafeGuard Wholesale',            'James Willis',     'j.willis@safeguard.example',        '+1-800-555-0400', 'Houston',     'TX', 'USA', 'ACTIVE'),
    ('SUP-COMP5',  'CoreTech Hardware Solutions',    'Amy Nakamura',     'amy.n@coretech.example',            '+1-800-555-0500', 'Austin',      'TX', 'USA', 'ACTIVE'),
    ('SUP-FURN6',  'ErgoFurnish Inc.',               'David Kim',        'd.kim@ergofurnish.example',         '+1-800-555-0600', 'Charlotte',   'NC', 'USA', 'ACTIVE'),
    ('SUP-PACK7',  'PackRight Materials',            'Elena Vasquez',    'e.vasquez@packright.example',       '+1-800-555-0700', 'Memphis',     'TN', 'USA', 'ACTIVE'),
    ('SUP-CLEN8',  'CleanForce Supplies Corp.',      'Robert Okafor',    'r.okafor@cleanforce.example',       '+1-800-555-0800', 'Columbus',    'OH', 'USA', 'ACTIVE')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- PRODUCTS (50+ products across 8 categories)
-- ============================================================
INSERT INTO products (sku, name, description, category_id, primary_supplier_id, unit_cost, selling_price, reorder_level, reorder_quantity, unit_of_measure, status)
SELECT p.sku, p.name, p.description,
       (SELECT id FROM categories WHERE name = p.category_name),
       (SELECT id FROM suppliers WHERE code = p.supplier_code),
       p.unit_cost, p.selling_price, p.reorder_level, p.reorder_quantity, p.uom, 'ACTIVE'
FROM (VALUES
    -- Electronics (cat: Electronics)
    ('ELEC-001', 'Wireless Bluetooth Headphones Pro',   'Premium noise-cancelling headphones with 40hr battery',   'Electronics',      'SUP-TECH1', 89.99,  149.99, 20, 50, 'Each'),
    ('ELEC-002', 'USB-C Hub 7-in-1',                   '4K HDMI, USB 3.0, SD card, USB-C PD 100W',               'Electronics',      'SUP-TECH1', 24.50,  49.99,  30, 100,'Each'),
    ('ELEC-003', '27" 4K Monitor IPS Panel',           'Wide color gamut, 144Hz, HDR400 certified',              'Electronics',      'SUP-TECH1', 310.00, 549.00, 5,  20, 'Each'),
    ('ELEC-004', 'Mechanical Keyboard TKL RGB',        'Cherry MX Red switches, aluminum frame',                 'Electronics',      'SUP-TECH1', 75.00,  139.99, 15, 30, 'Each'),
    ('ELEC-005', 'Wireless Ergonomic Mouse',            'Bluetooth + USB receiver, 4000 DPI adjustable',         'Electronics',      'SUP-TECH1', 32.00,  59.99,  25, 60, 'Each'),
    ('ELEC-006', 'Smart Power Strip 6-Outlet',          'Surge protection, USB-A x4, USB-C x2 ports',            'Electronics',      'SUP-TECH1', 18.00,  34.99,  40, 100,'Each'),
    ('ELEC-007', 'Webcam 4K Ultra HD',                  'Auto-focus, built-in stereo mic, wide-angle lens',      'Electronics',      'SUP-TECH1', 65.00,  119.99, 20, 40, 'Each'),
    ('ELEC-008', 'Portable Charger 20000mAh',           'Fast charge 45W, dual USB-C + USB-A',                   'Electronics',      'SUP-TECH1', 28.00,  54.99,  30, 75, 'Each'),
    -- Office Supplies
    ('OFFC-001', 'Premium Copy Paper A4 500-Sheet',    '80gsm bright white, ream',                               'Office Supplies',  'SUP-OFFX2', 4.20,   8.99,   100,500,'Ream'),
    ('OFFC-002', 'Ballpoint Pen Box of 50',             'Blue ink, medium point, smooth write',                  'Office Supplies',  'SUP-OFFX2', 5.50,   12.99,  50, 200,'Box'),
    ('OFFC-003', 'Stapler Heavy Duty',                  '100-sheet capacity, jam-free mechanism',                'Office Supplies',  'SUP-OFFX2', 14.00,  28.99,  20, 50, 'Each'),
    ('OFFC-004', 'Sticky Notes 3x3" 24-Pack',          'Repositionable, assorted neon colors',                  'Office Supplies',  'SUP-OFFX2', 9.60,   19.99,  30, 100,'Pack'),
    ('OFFC-005', 'Manila Folders Letter Size 100-Pack','Heavy-duty stock, 1/3-cut tab',                          'Office Supplies',  'SUP-OFFX2', 12.00,  24.99,  40, 150,'Box'),
    ('OFFC-006', 'Laminating Pouches 200-Pack',        '9x11.5" letter, 3mil thickness',                        'Office Supplies',  'SUP-OFFX2', 19.00,  38.99,  25, 100,'Box'),
    ('OFFC-007', 'Laser Printer Toner Black HP CF217A','Compatible with HP LaserJet Pro M102',                  'Office Supplies',  'SUP-OFFX2', 22.00,  44.99,  20, 60, 'Each'),
    ('OFFC-008', 'Whiteboard Markers 12-Pack',         'Assorted colors, chisel and bullet tip',                 'Office Supplies',  'SUP-OFFX2', 6.00,   12.99,  50, 150,'Pack'),
    -- Industrial Tools
    ('TOOL-001', 'Cordless Drill Driver 18V',           '2-speed, 13mm keyless chuck, 2x batteries + charger',   'Industrial Tools', 'SUP-TOOL3', 78.00,  149.99, 10, 20, 'Each'),
    ('TOOL-002', 'Angle Grinder 4.5" 850W',             'Variable speed, spindle lock, safety guard',            'Industrial Tools', 'SUP-TOOL3', 45.00,  89.99,  10, 20, 'Each'),
    ('TOOL-003', 'Digital Torque Wrench 3/8"',          '10-80 Nm range, ±2% accuracy, LCD display',            'Industrial Tools', 'SUP-TOOL3', 55.00,  109.99, 8,  20, 'Each'),
    ('TOOL-004', 'Combination Wrench Set 26-Piece',    'Metric and SAE chrome vanadium steel',                   'Industrial Tools', 'SUP-TOOL3', 42.00,  84.99,  10, 25, 'Set'),
    ('TOOL-005', 'Industrial Heat Gun 2000W',           '2 speed settings, 50-600°C range, overload protection', 'Industrial Tools', 'SUP-TOOL3', 38.00,  72.99,  10, 20, 'Each'),
    ('TOOL-006', 'Laser Level Self-Leveling 360°',     'Cross-line, IP54 waterproof, 30m range',                 'Industrial Tools', 'SUP-TOOL3', 62.00,  124.99, 5,  15, 'Each'),
    -- Safety Equipment
    ('SAFE-001', 'Hard Hat Class E ANSI Z89.1',        'Vented, 6-point ratchet suspension, hi-vis yellow',     'Safety Equipment', 'SUP-SAFE4', 12.50,  24.99,  50, 150,'Each'),
    ('SAFE-002', 'Safety Goggles Anti-Fog ANSI Z87.1', 'Indirect vent, clear polycarbonate lens',               'Safety Equipment', 'SUP-SAFE4', 4.80,   9.99,   100,300,'Each'),
    ('SAFE-003', 'Nitrile Gloves Powder-Free L Box/100','Medical grade, 4mil thickness',                        'Safety Equipment', 'SUP-SAFE4', 8.50,   17.99,  80, 300,'Box'),
    ('SAFE-004', 'High-Visibility Safety Vest Class 2', 'ANSI/ISEA 107, mesh, 2 reflective strips, S-5XL',      'Safety Equipment', 'SUP-SAFE4', 7.20,   14.99,  60, 200,'Each'),
    ('SAFE-005', 'First Aid Kit 200-Piece',             'OSHA compliant, wall-mount metal cabinet',              'Safety Equipment', 'SUP-SAFE4', 35.00,  69.99,  10, 25, 'Each'),
    ('SAFE-006', 'N95 Respirator Mask 20-Pack',        'NIOSH approved, foldable with valve',                   'Safety Equipment', 'SUP-SAFE4', 18.00,  36.99,  50, 200,'Box'),
    ('SAFE-007', 'Steel Toe Work Boot Size 10',         'ASTM F2413 rated, electrical hazard, waterproof',       'Safety Equipment', 'SUP-SAFE4', 65.00,  129.99, 5,  20, 'Pair'),
    -- Computer Hardware
    ('COMP-001', 'Server RAM 32GB DDR5 ECC',           'PC5-38400, registered ECC, dual-rank',                  'Computer Hardware','SUP-COMP5', 185.00, 349.99, 10, 20, 'Each'),
    ('COMP-002', 'NVMe SSD 2TB M.2 PCIe 4.0',         '7400/6800 MB/s read/write, 5yr warranty',               'Computer Hardware','SUP-COMP5', 145.00, 279.99, 8,  15, 'Each'),
    ('COMP-003', 'Managed Switch 24-Port GbE PoE+',   '370W PoE budget, L2+, fanless, rack-mount',             'Computer Hardware','SUP-COMP5', 280.00, 549.00, 5,  10, 'Each'),
    ('COMP-004', 'UPS 1500VA 900W Tower',              'LCD display, pure sine wave, USB/serial management',     'Computer Hardware','SUP-COMP5', 195.00, 379.00, 5,  10, 'Each'),
    ('COMP-005', 'CAT6A Ethernet Cable 305m Spool',    'U/FTP, 23AWG, plenum rated, 10GbE',                    'Computer Hardware','SUP-COMP5', 115.00, 225.00, 5,  10, 'Spool'),
    ('COMP-006', 'Rack Mount Server 1U Chassis',       'ATX/EATX, 8x 2.5" hot-swap bays, dual PSU',            'Computer Hardware','SUP-COMP5', 420.00, 820.00, 3,  8,  'Each'),
    ('COMP-007', 'KVM Switch 8-Port HDMI USB',         '4K@60Hz, hotkey switching, USB HID',                   'Computer Hardware','SUP-COMP5', 98.00,  189.99, 5,  15, 'Each'),
    -- Furniture
    ('FURN-001', 'Adjustable Standing Desk 60"x30"',  'Electric dual-motor, 4-memory presets, black frame',    'Furniture',        'SUP-FURN6', 380.00, 750.00, 3,  10, 'Each'),
    ('FURN-002', 'Ergonomic Mesh Office Chair',        'Lumbar support, adjustable armrests, 300lb capacity',   'Furniture',        'SUP-FURN6', 210.00, 419.99, 5,  15, 'Each'),
    ('FURN-003', 'Monitor Arm Dual VESA 75/100mm',     'Full motion, desk clamp + grommet, 2x 32" capacity',   'Furniture',        'SUP-FURN6', 55.00,  109.99, 8,  20, 'Each'),
    ('FURN-004', 'Cable Management Tray Under-Desk',   'Powder-coated steel, 24" x 4", easy install',          'Furniture',        'SUP-FURN6', 18.00,  34.99,  20, 50, 'Each'),
    ('FURN-005', 'Whiteboard 4x6 Feet Magnetic',      'Aluminium frame, dry-erase, includes tray',             'Furniture',        'SUP-FURN6', 85.00,  169.99, 5,  12, 'Each'),
    -- Packaging
    ('PACK-001', 'Shipping Boxes 12x10x8" 25-Pack',   'Single-wall corrugated, 32 ECT',                        'Packaging',        'SUP-PACK7', 18.00,  34.99,  50, 200,'Bundle'),
    ('PACK-002', 'Bubble Wrap Roll 12"x100ft',         '3/16" small bubble, perforated every 12"',              'Packaging',        'SUP-PACK7', 14.00,  27.99,  30, 100,'Roll'),
    ('PACK-003', 'Packing Tape 2"x110yd 12-Pack',     'Clear, 2.2mil thickness, hot-melt adhesive',            'Packaging',        'SUP-PACK7', 22.00,  42.99,  40, 150,'Case'),
    ('PACK-004', 'Thermal Shipping Label 4x6" 500-Ct','Direct thermal, 1" core, compatible ZPL printers',      'Packaging',        'SUP-PACK7', 16.00,  31.99,  60, 200,'Roll'),
    ('PACK-005', 'Void Fill Packing Peanuts 20 Cu Ft', 'Anti-static, ESD-safe, white',                         'Packaging',        'SUP-PACK7', 28.00,  54.99,  20, 60, 'Bag'),
    ('PACK-006', 'Stretch Wrap Film 18"x1500ft',       'Hand roll, 80ga cast film, clear',                      'Packaging',        'SUP-PACK7', 19.00,  37.99,  25, 80, 'Roll'),
    -- Cleaning Supplies
    ('CLEN-001', 'Industrial Floor Cleaner 5-Gallon',  'Neutral pH concentrate, citrus fragrance, eco-cert',   'Cleaning Supplies','SUP-CLEN8', 22.00,  44.99,  20, 60, 'Pail'),
    ('CLEN-002', 'Microfiber Cloths 24-Pack',          '16x16", commercial grade, color-coded',                 'Cleaning Supplies','SUP-CLEN8', 12.00,  24.99,  40, 150,'Pack'),
    ('CLEN-003', 'Commercial Mop and Bucket Set',      '32oz cotton mop, 35qt galvanized bucket with wringer', 'Cleaning Supplies','SUP-CLEN8', 38.00,  74.99,  8,  20, 'Set'),
    ('CLEN-004', 'Hand Sanitizer Gel 1-Gallon',        '70% ethyl alcohol, pump-top dispenser bottle',         'Cleaning Supplies','SUP-CLEN8', 14.00,  27.99,  30, 100,'Gallon'),
    ('CLEN-005', 'Disinfectant Spray 32oz 12-Pack',    'Hospital-grade quaternary ammonium, kills 99.9%',       'Cleaning Supplies','SUP-CLEN8', 28.00,  54.99,  25, 80, 'Case'),
    ('CLEN-006', 'Industrial Trash Bags 55-Gallon 50-Ct','1.5mil heavy duty, black, drawstring',               'Cleaning Supplies','SUP-CLEN8', 24.00,  47.99,  30, 100,'Case')
) AS p(sku, name, description, category_name, supplier_code, unit_cost, selling_price, reorder_level, reorder_quantity, uom)
ON CONFLICT (sku) DO NOTHING;

-- Link products to their primary suppliers
INSERT INTO product_suppliers (product_id, supplier_id, unit_cost, is_primary)
SELECT p.id, p.primary_supplier_id, p.unit_cost, TRUE
FROM products p
WHERE p.primary_supplier_id IS NOT NULL
ON CONFLICT (product_id, supplier_id) DO NOTHING;

-- ============================================================
-- INVENTORY BALANCES (realistic mixture of healthy/low/out)
-- ============================================================
-- East Coast warehouse balances
INSERT INTO inventory_balances (product_id, warehouse_id, quantity, last_movement_at)
SELECT p.id, w.id, qty, NOW() - (random() * INTERVAL '3 days')
FROM (VALUES
    ('ELEC-001', 85),  ('ELEC-002', 240), ('ELEC-003', 12), ('ELEC-004', 45),
    ('ELEC-005', 95),  ('ELEC-006', 185), ('ELEC-007', 28), ('ELEC-008', 120),
    ('OFFC-001', 450), ('OFFC-002', 180), ('OFFC-003', 35), ('OFFC-004', 88),
    ('OFFC-005', 160), ('OFFC-006', 55),  ('OFFC-007', 18), ('OFFC-008', 95),
    ('TOOL-001', 22),  ('TOOL-002', 8),   ('TOOL-003', 5),  ('TOOL-004', 18),
    ('TOOL-005', 12),  ('TOOL-006', 3),   ('SAFE-001', 320),('SAFE-002', 580),
    ('SAFE-003', 240), ('SAFE-004', 195), ('SAFE-005', 28), ('SAFE-006', 175),
    ('SAFE-007', 4),   ('COMP-001', 15),  ('COMP-002', 12), ('COMP-003', 4),
    ('COMP-004', 7),   ('COMP-005', 6),   ('COMP-006', 2),  ('COMP-007', 8),
    ('FURN-001', 5),   ('FURN-002', 14),  ('FURN-003', 25), ('FURN-004', 65),
    ('FURN-005', 8),   ('PACK-001', 380), ('PACK-002', 85), ('PACK-003', 145),
    ('PACK-004', 220), ('PACK-005', 48),  ('PACK-006', 72), ('CLEN-001', 95),
    ('CLEN-002', 210), ('CLEN-003', 22),  ('CLEN-004', 145),('CLEN-005', 68),
    ('CLEN-006', 110)
) AS d(sku, qty)
JOIN products p ON p.sku = d.sku
CROSS JOIN warehouses w WHERE w.code = 'WH-EAST'
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- West Coast warehouse balances
INSERT INTO inventory_balances (product_id, warehouse_id, quantity, last_movement_at)
SELECT p.id, w.id, qty, NOW() - (random() * INTERVAL '5 days')
FROM (VALUES
    ('ELEC-001', 60),  ('ELEC-002', 180), ('ELEC-003', 8),  ('ELEC-004', 32),
    ('ELEC-005', 72),  ('ELEC-006', 145), ('ELEC-007', 15), ('ELEC-008', 95),
    ('OFFC-001', 320), ('OFFC-002', 140), ('OFFC-003', 18), ('OFFC-004', 55),
    ('OFFC-005', 85),  ('OFFC-006', 30),  ('OFFC-007', 6),  ('OFFC-008', 60),
    ('TOOL-001', 15),  ('TOOL-002', 5),   ('TOOL-003', 3),  ('TOOL-004', 12),
    ('TOOL-005', 8),   ('TOOL-006', 2),   ('SAFE-001', 220),('SAFE-002', 420),
    ('SAFE-003', 180), ('SAFE-004', 130), ('SAFE-005', 15), ('SAFE-006', 120),
    ('SAFE-007', 2),   ('COMP-001', 8),   ('COMP-002', 6),  ('COMP-003', 3),
    ('COMP-004', 4),   ('COMP-005', 3),   ('COMP-006', 0),  ('COMP-007', 5),
    ('FURN-001', 3),   ('FURN-002', 9),   ('FURN-003', 18), ('FURN-004', 42),
    ('FURN-005', 5),   ('PACK-001', 250), ('PACK-002', 65), ('PACK-003', 95),
    ('PACK-004', 165), ('PACK-005', 32),  ('PACK-006', 48), ('CLEN-001', 60),
    ('CLEN-002', 155), ('CLEN-003', 14),  ('CLEN-004', 95), ('CLEN-005', 42),
    ('CLEN-006', 75)
) AS d(sku, qty)
JOIN products p ON p.sku = d.sku
CROSS JOIN warehouses w WHERE w.code = 'WH-WEST'
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- Central warehouse balances
INSERT INTO inventory_balances (product_id, warehouse_id, quantity, last_movement_at)
SELECT p.id, w.id, qty, NOW() - (random() * INTERVAL '2 days')
FROM (VALUES
    ('ELEC-001', 40),  ('ELEC-002', 120), ('ELEC-003', 5),  ('ELEC-004', 20),
    ('ELEC-005', 48),  ('ELEC-006', 95),  ('ELEC-007', 10), ('ELEC-008', 60),
    ('OFFC-001', 220), ('OFFC-002', 95),  ('OFFC-003', 12), ('OFFC-004', 35),
    ('OFFC-005', 60),  ('OFFC-006', 18),  ('OFFC-007', 3),  ('OFFC-008', 40),
    ('TOOL-001', 10),  ('TOOL-002', 3),   ('TOOL-003', 0),  ('TOOL-004', 8),
    ('TOOL-005', 5),   ('TOOL-006', 0),   ('SAFE-001', 150),('SAFE-002', 280),
    ('SAFE-003', 120), ('SAFE-004', 85),  ('SAFE-005', 10), ('SAFE-006', 80),
    ('SAFE-007', 0),   ('COMP-001', 5),   ('COMP-002', 4),  ('COMP-003', 0),
    ('COMP-004', 3),   ('COMP-005', 2),   ('COMP-006', 0),  ('COMP-007', 3),
    ('FURN-001', 2),   ('FURN-002', 6),   ('FURN-003', 12), ('FURN-004', 28),
    ('FURN-005', 3),   ('PACK-001', 180), ('PACK-002', 45), ('PACK-003', 65),
    ('PACK-004', 110), ('PACK-005', 22),  ('PACK-006', 32), ('CLEN-001', 42),
    ('CLEN-002', 110), ('CLEN-003', 8),   ('CLEN-004', 65), ('CLEN-005', 28),
    ('CLEN-006', 50)
) AS d(sku, qty)
JOIN products p ON p.sku = d.sku
CROSS JOIN warehouses w WHERE w.code = 'WH-CENT'
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- ============================================================
-- STOCK MOVEMENTS (realistic historical data over 90 days)
-- We insert movements that correspond to the current balances.
-- All performed_by = admin user (id=1)
-- ============================================================

-- Opening receipt movements (day 0 = 90 days ago) for East warehouse
INSERT INTO stock_movements (
    reference_number, movement_type, product_id, dest_warehouse_id,
    quantity, unit_cost, total_value, reason, performed_by, supplier_id, created_at, status
)
SELECT
    'REC-INIT-EAST-' || p.sku,
    'RECEIPT',
    p.id,
    w.id,
    CASE
        WHEN ib.quantity > 0 THEN ib.quantity + FLOOR(random() * 50 + 10)::int
        ELSE FLOOR(random() * 100 + 20)::int
    END,
    p.unit_cost,
    p.unit_cost * (CASE WHEN ib.quantity > 0 THEN ib.quantity + FLOOR(random() * 50 + 10)::int ELSE FLOOR(random() * 100 + 20)::int END),
    'Opening stock - initial inventory receipt',
    (SELECT id FROM users WHERE username = 'admin'),
    p.primary_supplier_id,
    NOW() - INTERVAL '90 days',
    'COMPLETED'
FROM products p
JOIN warehouses w ON w.code = 'WH-EAST'
LEFT JOIN inventory_balances ib ON ib.product_id = p.id AND ib.warehouse_id = w.id
ON CONFLICT (reference_number) DO NOTHING;

-- Replenishment receipts (30-60 days ago) - West warehouse
INSERT INTO stock_movements (
    reference_number, movement_type, product_id, dest_warehouse_id,
    quantity, unit_cost, total_value, reason, performed_by, supplier_id, created_at, status
)
SELECT
    'REC-REPL-WEST-' || p.sku || '-' || FLOOR(random() * 1000 + 1)::text,
    'RECEIPT',
    p.id,
    w.id,
    FLOOR(random() * 80 + 20)::int,
    p.unit_cost,
    p.unit_cost * FLOOR(random() * 80 + 20)::int,
    'Scheduled replenishment order',
    (SELECT id FROM users WHERE username = 'manager'),
    p.primary_supplier_id,
    NOW() - (INTERVAL '30 days' + random() * INTERVAL '30 days'),
    'COMPLETED'
FROM products p
JOIN warehouses w ON w.code = 'WH-WEST'
WHERE p.id % 2 = 0
ON CONFLICT (reference_number) DO NOTHING;

-- Issue movements (1-30 days ago) - simulates outgoing stock
INSERT INTO stock_movements (
    reference_number, movement_type, product_id, source_warehouse_id,
    quantity, unit_cost, total_value, reason, external_reference, performed_by, created_at, status
)
SELECT
    'ISS-' || w.code || '-' || p.sku || '-' || TO_CHAR(NOW() - (n * INTERVAL '3 days'), 'YYYYMMDD'),
    'ISSUE',
    p.id,
    w.id,
    GREATEST(1, FLOOR(random() * 15 + 1)::int),
    p.unit_cost,
    p.unit_cost * GREATEST(1, FLOOR(random() * 15 + 1)::int),
    'Customer order fulfillment',
    'ORD-' || TO_CHAR(NOW() - (n * INTERVAL '3 days'), 'YYYYMMDD') || '-' || LPAD(FLOOR(random() * 9999 + 1)::text, 4, '0'),
    (SELECT id FROM users WHERE username = 'staff'),
    NOW() - (n * INTERVAL '3 days'),
    'COMPLETED'
FROM products p
CROSS JOIN warehouses w
CROSS JOIN generate_series(1, 10) AS n
WHERE p.sku LIKE 'ELEC%' OR p.sku LIKE 'OFFC%' OR p.sku LIKE 'SAFE%'
ON CONFLICT (reference_number) DO NOTHING;

-- Transfer movements between warehouses (last 45 days)
INSERT INTO stock_movements (
    reference_number, movement_type, product_id, source_warehouse_id, dest_warehouse_id,
    quantity, unit_cost, total_value, reason, performed_by, created_at, status
)
SELECT
    'TRF-' || sw.code || '-' || dw.code || '-' || p.sku || '-' || n,
    'TRANSFER',
    p.id,
    sw.id,
    dw.id,
    GREATEST(1, FLOOR(random() * 10 + 2)::int),
    p.unit_cost,
    p.unit_cost * GREATEST(1, FLOOR(random() * 10 + 2)::int),
    'Inventory balancing between warehouses',
    (SELECT id FROM users WHERE username = 'manager'),
    NOW() - (n * INTERVAL '10 days'),
    'COMPLETED'
FROM products p
CROSS JOIN (SELECT id, code FROM warehouses WHERE code = 'WH-EAST') sw
CROSS JOIN (SELECT id, code FROM warehouses WHERE code = 'WH-WEST') dw
CROSS JOIN generate_series(1, 4) AS n
WHERE p.sku IN ('ELEC-001','ELEC-002','OFFC-001','SAFE-001','COMP-001','PACK-001')
ON CONFLICT (reference_number) DO NOTHING;

-- Adjustment movements (corrections, last 60 days)
INSERT INTO stock_movements (
    reference_number, movement_type, product_id, dest_warehouse_id,
    quantity, unit_cost, total_value, reason, performed_by, created_at, status
)
SELECT
    'ADJ-' || w.code || '-' || p.sku || '-' || n,
    'ADJUSTMENT',
    p.id,
    w.id,
    GREATEST(1, FLOOR(random() * 5 + 1)::int),
    p.unit_cost,
    p.unit_cost * GREATEST(1, FLOOR(random() * 5 + 1)::int),
    'Physical count discrepancy correction',
    (SELECT id FROM users WHERE username = 'manager'),
    NOW() - (n * INTERVAL '20 days'),
    'COMPLETED'
FROM products p
CROSS JOIN warehouses w
CROSS JOIN generate_series(1, 3) AS n
WHERE p.sku IN ('ELEC-003','OFFC-007','TOOL-003','SAFE-007','COMP-006')
ON CONFLICT (reference_number) DO NOTHING;

-- Return movements (last 30 days)
INSERT INTO stock_movements (
    reference_number, movement_type, product_id, dest_warehouse_id,
    quantity, unit_cost, total_value, reason, external_reference, performed_by, created_at, status
)
SELECT
    'RET-' || w.code || '-' || p.sku || '-' || n,
    'RETURN',
    p.id,
    w.id,
    GREATEST(1, FLOOR(random() * 5 + 1)::int),
    p.unit_cost,
    p.unit_cost * GREATEST(1, FLOOR(random() * 5 + 1)::int),
    'Customer return - item in resaleable condition',
    'RMA-' || LPAD(FLOOR(random() * 9999 + 1)::text, 5, '0'),
    (SELECT id FROM users WHERE username = 'staff'),
    NOW() - (n * INTERVAL '7 days'),
    'COMPLETED'
FROM products p
CROSS JOIN warehouses w
CROSS JOIN generate_series(1, 2) AS n
WHERE p.sku IN ('ELEC-001','ELEC-004','ELEC-007','OFFC-003')
ON CONFLICT (reference_number) DO NOTHING;

-- Additional recent receipts (Central warehouse, last 15 days)
INSERT INTO stock_movements (
    reference_number, movement_type, product_id, dest_warehouse_id,
    quantity, unit_cost, total_value, reason, performed_by, supplier_id, created_at, status
)
SELECT
    'REC-CENT-' || p.sku || '-' || n,
    'RECEIPT',
    p.id,
    w.id,
    FLOOR(random() * 60 + 20)::int,
    p.unit_cost,
    p.unit_cost * FLOOR(random() * 60 + 20)::int,
    'Urgent replenishment - stockout prevention',
    (SELECT id FROM users WHERE username = 'manager'),
    p.primary_supplier_id,
    NOW() - (n * INTERVAL '5 days'),
    'COMPLETED'
FROM products p
JOIN warehouses w ON w.code = 'WH-CENT'
CROSS JOIN generate_series(1, 3) AS n
WHERE p.sku LIKE 'CLEN%' OR p.sku LIKE 'PACK%'
ON CONFLICT (reference_number) DO NOTHING;

-- Audit events for key operations
INSERT INTO audit_events (event_type, entity_type, entity_id, performed_by, details, created_at)
SELECT
    e.event_type,
    e.entity_type,
    e.entity_id,
    (SELECT id FROM users WHERE username = e.username),
    e.details,
    NOW() - e.days_ago * INTERVAL '1 day'
FROM (VALUES
    ('USER_LOGIN',       'User',    '1', 'admin',   'Admin login from application',               5),
    ('USER_LOGIN',       'User',    '2', 'manager', 'Manager login from application',             4),
    ('PRODUCT_CREATED',  'Product', '1', 'admin',   'Created product ELEC-001',                  89),
    ('WAREHOUSE_CREATED','Warehouse','1','admin',   'Created WH-EAST warehouse',                  90),
    ('STOCK_RECEIVED',   'Movement','1', 'manager', 'Initial receipt for ELEC-001 at WH-EAST',   89),
    ('STOCK_ADJUSTED',   'Movement','2', 'manager', 'Physical count correction for OFFC-007',    40),
    ('STOCK_TRANSFERRED','Movement','3', 'manager', 'Transfer ELEC-001 from WH-EAST to WH-WEST', 20),
    ('SUPPLIER_UPDATED', 'Supplier','1', 'manager', 'Updated contact details for TechCore',       10),
    ('USER_LOGIN',       'User',    '3', 'staff',   'Staff login from application',               1),
    ('STOCK_ISSUED',     'Movement','4', 'staff',   'Issue ELEC-001 for customer order',          1)
) AS e(event_type, entity_type, entity_id, username, details, days_ago)
ON CONFLICT DO NOTHING;
