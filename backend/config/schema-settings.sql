
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT
);

-- Seed default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_name', 'My Jewellery Shop');
INSERT OR IGNORE INTO settings (key, value) VALUES ('shop_address', '123 Main St, Anytown, USA');
INSERT OR IGNORE INTO settings (key, value) VALUES ('gst_percentage', '3');
