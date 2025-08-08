-- Jewellery Management System Seed Data for PostgreSQL

-- Clear existing data (optional - remove if you want to keep existing data)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE transaction_items CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE loyalty CASCADE;
TRUNCATE TABLE hallmarking CASCADE;
TRUNCATE TABLE inventory CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE transaction_items_id_seq RESTART WITH 1;
ALTER SEQUENCE inventory_id_seq RESTART WITH 1;
ALTER SEQUENCE hallmarking_id_seq RESTART WITH 1;
ALTER SEQUENCE loyalty_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;

-- ========================================
-- USERS (Admin and Staff)
-- ========================================
-- Passwords 'admin123' hashed using bcrypt
INSERT INTO users (username, email, password, first_name, last_name, role, phone, is_active) VALUES
('admin', 'admin@jewellery.com', '$2b$10$rQZ8K9mX2nL5vF7hJ3cP1qA4sD6gH8iK9lM0nO1pQ2rS3tU4vW5xY6zA7bC8dE9fF0gG1hH2iI3jJ4kK5lL6mM7nN8oO9pP0qQ1rR2sS3tT4uU5vV6wW7xX8yY9zZ', 'John', 'Admin', 'admin', '+1234567890', true),
('manager', 'manager@jewellery.com', '$2b$10$rQZ8K9mX2nL5vF7hJ3cP1qA4sD6gH8iK9lM0nO1pQ2rS3tU4vW5xY6zA7bC8dE9fF0gG1hH2iI3jJ4kK5lL6mM7nN8oO9pP0qQ1rR2sS3tT4uU5vV6wW7xX8yY9zZ', 'Sarah', 'Manager', 'manager', '+1234567891', true),
('sales1', 'sales1@jewellery.com', '$2b$10$rQZ8K9mX2nL5vF7hJ3cP1qA4sD6gH8iK9lM0nO1pQ2rS3tU4vW5xY6zA7bC8dE9fF0gG1hH2iI3jJ4kK5lL6mM7nN8oO9pP0qQ1rR2sS3tT4uU5vV6wW7xX8yY9zZ', 'Mike', 'Johnson', 'sales', '+1234567892', true),
('sales2', 'sales2@jewellery.com', '$2b$10$rQZ8K9mX2nL5vF7hJ3cP1qA4sD6gH8iK9lM0nO1pQ2rS3tT4uU5vV6wW7xX8yY9zZ', 'Emily', 'Davis', 'sales', '+1234567893', true),
('inventory', 'inventory@jewellery.com', '$2b$10$rQZ8K9mX2nL5vF7hJ3cP1qA4sD6gH8iK9lM0nO1pQ2rS3tT4uU5vV6wW7xX8yY9zZ', 'David', 'Wilson', 'inventory', '+1234567894', true);

-- ========================================
-- CUSTOMERS
-- ========================================

INSERT INTO customers (name, email, phone, address, date_of_birth, gender, preferences, loyalty_points, total_spent) VALUES
('Alice Johnson', 'alice.johnson@email.com', '+1234567895', '123 Main St, City, State 12345', '1985-03-15', 'Female', 'Prefers gold jewelry, size 7 ring', 150, 2500.00),
('Bob Smith', 'bob.smith@email.com', '+1234567896', '456 Oak Ave, City, State 12345', '1990-07-22', 'Male', 'Likes platinum, size 10 ring', 75, 1200.00),
('Carol Davis', 'carol.davis@email.com', '+1234567897', '789 Pine Rd, City, State 12345', '1988-11-08', 'Female', 'Diamond jewelry, size 6.5 ring', 300, 4500.00),
('David Wilson', 'david.wilson@email.com', '+1234567898', '321 Elm St, City, State 12345', '1982-05-12', 'Male', 'Silver jewelry, size 9 ring', 50, 800.00),
('Emma Brown', 'emma.brown@email.com', '+1234567899', '654 Maple Dr, City, State 12345', '1995-09-30', 'Female', 'Rose gold, size 7.5 ring', 200, 3200.00),
('Frank Miller', 'frank.miller@email.com', '+1234567900', '987 Cedar Ln, City, State 12345', '1987-12-03', 'Male', 'White gold, size 8.5 ring', 125, 1800.00),
('Grace Lee', 'grace.lee@email.com', '+1234567901', '147 Birch Way, City, State 12345', '1992-04-18', 'Female', 'Pearl jewelry, size 6 ring', 400, 6000.00),
('Henry Taylor', 'henry.taylor@email.com', '+1234567902', '258 Spruce Ct, City, State 12345', '1980-08-25', 'Male', 'Yellow gold, size 9.5 ring', 100, 1500.00);

-- ========================================
-- PRODUCTS
-- ========================================

INSERT INTO products (name, description, category, subcategory, sku, barcode, weight, purity, metal_type, stone_type, stone_weight, cost_price, selling_price, discount_percentage, stock_quantity, reorder_level, supplier, is_active) VALUES
-- Gold Rings
('18K Gold Wedding Ring', 'Classic 18K gold wedding ring with elegant design', 'Rings', 'Wedding Rings', 'GR001', '1234567890123', 3.5, '18K', 'Gold', NULL, NULL, 800.00, 1200.00, 0, 15, 5, 'Gold Supplier Co', true),
('14K Gold Diamond Ring', 'Beautiful 14K gold ring with 0.5 carat diamond', 'Rings', 'Diamond Rings', 'GR002', '1234567890124', 4.2, '14K', 'Gold', 'Diamond', 0.5, 1200.00, 1800.00, 5, 8, 3, 'Diamond Source', true),
('22K Gold Traditional Ring', 'Traditional 22K gold ring with intricate design', 'Rings', 'Traditional', 'GR003', '1234567890125', 5.0, '22K', 'Gold', NULL, NULL, 1500.00, 2200.00, 0, 12, 4, 'Traditional Jewellers', true),

-- Necklaces
('18K Gold Chain Necklace', 'Elegant 18K gold chain necklace', 'Necklaces', 'Chains', 'GN001', '1234567890126', 8.5, '18K', 'Gold', NULL, NULL, 1200.00, 1800.00, 0, 10, 3, 'Gold Supplier Co', true),
('Platinum Diamond Pendant', 'Stunning platinum pendant with 1 carat diamond', 'Necklaces', 'Pendants', 'GN002', '1234567890127', 6.8, '950', 'Platinum', 'Diamond', 1.0, 2500.00, 3800.00, 10, 6, 2, 'Diamond Source', true),
('Silver Pearl Necklace', 'Elegant silver necklace with freshwater pearls', 'Necklaces', 'Pearl', 'GN003', '1234567890128', 12.0, '925', 'Silver', 'Pearl', 8.0, 300.00, 450.00, 0, 20, 5, 'Pearl Traders', true),

-- Earrings
('18K Gold Stud Earrings', 'Classic 18K gold stud earrings', 'Earrings', 'Studs', 'GE001', '1234567890129', 2.5, '18K', 'Gold', NULL, NULL, 400.00, 600.00, 0, 25, 8, 'Gold Supplier Co', true),
('Diamond Drop Earrings', 'Elegant diamond drop earrings with 0.3 carat diamonds', 'Earrings', 'Drops', 'GE002', '1234567890130', 3.2, '14K', 'Gold', 'Diamond', 0.6, 800.00, 1200.00, 5, 15, 5, 'Diamond Source', true),
('Silver Hoop Earrings', 'Timeless silver hoop earrings', 'Earrings', 'Hoops', 'GE003', '1234567890131', 4.0, '925', 'Silver', NULL, NULL, 150.00, 250.00, 0, 30, 10, 'Silver Crafters', true),

-- Bracelets
('18K Gold Bangle', 'Elegant 18K gold bangle bracelet', 'Bracelets', 'Bangles', 'GB001', '1234567890132', 7.5, '18K', 'Gold', NULL, NULL, 1000.00, 1500.00, 0, 12, 4, 'Gold Supplier Co', true),
('Diamond Tennis Bracelet', 'Stunning diamond tennis bracelet with 2 carats total', 'Bracelets', 'Tennis', 'GB002', '1234567890133', 9.2, '14K', 'Gold', 'Diamond', 2.0, 2000.00, 3000.00, 8, 8, 3, 'Diamond Source', true),
('Silver Charm Bracelet', 'Charming silver bracelet with multiple charms', 'Bracelets', 'Charms', 'GB003', '1234567890134', 6.0, '925', 'Silver', NULL, NULL, 200.00, 350.00, 0, 18, 6, 'Silver Crafters', true);

-- ========================================
-- TRANSACTIONS (Sample Sales)
-- ========================================

INSERT INTO transactions (customer_id, user_id, transaction_type, total_amount, discount_amount, tax_amount, final_amount, payment_method, payment_status, transaction_status, notes) VALUES
(1, 3, 'sale', 1800.00, 90.00, 90.00, 1800.00, 'credit_card', 'completed', 'completed', 'Diamond ring purchase'),
(2, 4, 'sale', 1200.00, 0.00, 60.00, 1260.00, 'cash', 'completed', 'completed', 'Gold chain purchase'),
(3, 3, 'sale', 3800.00, 380.00, 190.00, 3610.00, 'bank_transfer', 'completed', 'completed', 'Platinum pendant purchase'),
(4, 4, 'sale', 450.00, 0.00, 22.50, 472.50, 'cash', 'completed', 'completed', 'Silver necklace purchase'),
(5, 3, 'sale', 1200.00, 60.00, 60.00, 1200.00, 'credit_card', 'completed', 'completed', 'Diamond earrings purchase'),
(6, 4, 'sale', 250.00, 0.00, 12.50, 262.50, 'cash', 'completed', 'completed', 'Silver earrings purchase'),
(7, 3, 'sale', 3000.00, 300.00, 150.00, 2850.00, 'credit_card', 'completed', 'completed', 'Diamond bracelet purchase'),
(8, 4, 'sale', 1500.00, 0.00, 75.00, 1575.00, 'cash', 'completed', 'completed', 'Gold bangle purchase');

-- ========================================
-- TRANSACTION ITEMS
-- ========================================

INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, total_price, discount_percentage) VALUES
(1, 2, 1, 1800.00, 1800.00, 5),
(2, 4, 1, 1200.00, 1200.00, 0),
(3, 5, 1, 3800.00, 3800.00, 10),
(4, 6, 1, 450.00, 450.00, 0),
(5, 8, 1, 1200.00, 1200.00, 5),
(6, 9, 1, 250.00, 250.00, 0),
(7, 11, 1, 3000.00, 3000.00, 10),
(8, 10, 1, 1500.00, 1500.00, 0);

-- ========================================
-- INVENTORY
-- ========================================
-- Note: This table is no longer strictly needed if `stock_quantity` is on the `products` table
-- This data is here for legacy/reference purposes
INSERT INTO inventory (product_id, quantity, location, notes) VALUES
(1, 15, 'Main Store - Display Case A', 'Premium location near entrance'),
(2, 8, 'Main Store - Display Case B', 'Locked display for high-value items'),
(3, 12, 'Main Store - Traditional Section', 'Traditional jewelry section'),
(4, 10, 'Main Store - Necklace Section', 'Necklace display area'),
(5, 6, 'Main Store - Premium Section', 'High-value items, security monitored'),
(6, 20, 'Main Store - Silver Section', 'Silver jewelry display'),
(7, 25, 'Main Store - Earring Section', 'Earring display area'),
(8, 15, 'Main Store - Diamond Section', 'Diamond jewelry, security monitored'),
(9, 30, 'Main Store - Silver Section', 'Silver earrings display'),
(10, 12, 'Main Store - Bracelet Section', 'Bracelet display area'),
(11, 8, 'Main Store - Premium Section', 'High-value diamond bracelet'),
(12, 18, 'Main Store - Silver Section', 'Charm bracelet display');

-- ========================================
-- HALLMARKING
-- ========================================

INSERT INTO hallmarking (product_id, hallmark_number, purity_verified, weight_verified, certification_date, certifying_authority, notes) VALUES
(1, 'HALL001-2024', true, true, '2024-01-15', 'Bureau of Indian Standards', '18K gold verified'),
(2, 'HALL002-2024', true, true, '2024-01-20', 'Bureau of Indian Standards', '14K gold with diamond verified'),
(3, 'HALL003-2024', true, true, '2024-01-25', 'Bureau of Indian Standards', '22K traditional gold verified'),
(4, 'HALL004-2024', true, true, '2024-02-01', 'Bureau of Indian Standards', '18K gold chain verified'),
(5, 'HALL005-2024', true, true, '2024-02-05', 'Bureau of Indian Standards', 'Platinum with diamond verified'),
(6, 'HALL006-2024', true, true, '2024-02-10', 'Bureau of Indian Standards', '925 silver with pearls verified');

-- ========================================
-- LOYALTY
-- ========================================
-- Adjusted to use a single 'points' column to match the model logic
INSERT INTO loyalty (customer_id, points, transaction_id, redeemed) VALUES
(1, 250, 1, false),
(1, -100, NULL, true), -- Redemption
(2, 120, 2, false),
(2, -45, NULL, true), -- Redemption
(3, 450, 3, false),
(3, -150, NULL, true), -- Redemption
(4, 80, 4, false),
(4, -30, NULL, true), -- Redemption
(5, 320, 5, false),
(5, -120, NULL, true), -- Redemption
(6, 180, 6, false),
(6, -55, NULL, true), -- Redemption
(7, 600, 7, false),
(7, -200, NULL, true), -- Redemption
(8, 150, 8, false),
(8, -50, NULL, true); -- Redemption

-- ========================================
-- AUDIT LOGS (Sample Activity)
-- ========================================

INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent) VALUES
(1, 'CREATE', 'users', 2, NULL, '{"username":"manager","email":"manager@jewellery.com","role":"manager"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(1, 'UPDATE', 'products', 1, '{"stock_quantity":20}', '{"stock_quantity":15}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(2, 'CREATE', 'customers', 1, NULL, '{"name":"Alice Johnson","email":"alice.johnson@email.com"}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(3, 'CREATE', 'transactions', 1, NULL, '{"total_amount":1800.00}', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
(4, 'UPDATE', 'products', 1, '{"stock_quantity":20}', '{"stock_quantity":15}', '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

-- ========================================
-- COMMIT TRANSACTION
-- ========================================

COMMIT;