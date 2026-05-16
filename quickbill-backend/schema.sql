-- ============================================================
-- QuickBill — MySQL Database Schema
-- Stationery & Electronics Retail POS
-- ============================================================

-- CREATE DATABASE IF NOT EXISTS quickbill CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quickbill_db;

-- ------------------------------------------------------------
-- 1. USERS
--    role='owner' => full access
--    role='worker' => shared cashier account (POS only)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  username     VARCHAR(50)   UNIQUE NOT NULL,
  password     VARCHAR(255)  NOT NULL,
  role         ENUM('owner', 'worker') NOT NULL DEFAULT 'worker',
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  description TEXT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. PRODUCTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(200)  NOT NULL,
  sku                VARCHAR(100)  UNIQUE,
  barcode            VARCHAR(100)  UNIQUE,
  category_id        INT,
  description        TEXT,
  unit               VARCHAR(50)   NOT NULL DEFAULT 'piece',
  selling_price      DECIMAL(10,2) NOT NULL,
  cost_price         DECIMAL(10,2),
  tax_rate           DECIMAL(5,2)  NOT NULL DEFAULT 18.00,  -- GST %
  quantity_in_stock  INT           NOT NULL DEFAULT 0,
  min_stock_level    INT           NOT NULL DEFAULT 5,
  is_active          BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_product_sku     (sku),
  INDEX idx_product_barcode (barcode),
  INDEX idx_product_name    (name),
  INDEX idx_product_active  (is_active)
);

-- ------------------------------------------------------------
-- 4. STOCK MOVEMENTS  (immutable audit log)
--    quantity_change: positive = stock IN, negative = stock OUT
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  product_id       INT NOT NULL,
  type             ENUM('purchase', 'sale', 'adjustment', 'return', 'damage') NOT NULL,
  quantity_change  INT NOT NULL,
  quantity_before  INT NOT NULL,
  quantity_after   INT NOT NULL,
  reference_id     INT  DEFAULT NULL,  -- order_id when type='sale'
  note             TEXT,
  created_by       INT  DEFAULT NULL,  -- user who triggered the movement
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_sm_product   (product_id),
  INDEX idx_sm_type      (type),
  INDEX idx_sm_created   (created_at)
);

-- ------------------------------------------------------------
-- 5. ORDERS  (sale header)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_name   VARCHAR(200),
  customer_phone  VARCHAR(20),
  subtotal        DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  grand_total     DECIMAL(10,2) NOT NULL,
  payment_method  ENUM('CASH', 'UPI', 'CARD') NOT NULL DEFAULT 'CASH',
  payment_status  ENUM('paid', 'pending')      NOT NULL DEFAULT 'paid',
  order_status    ENUM('completed', 'void')    NOT NULL DEFAULT 'completed',
  notes           TEXT,
  processed_by    INT DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (processed_by) REFERENCES users(id),
  INDEX idx_order_status  (order_status),
  INDEX idx_order_created (created_at),
  INDEX idx_order_worker  (processed_by)
);

-- ------------------------------------------------------------
-- 6. ORDER ITEMS  (sale line items — snapshot prices at sale time)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT           NOT NULL,
  product_id     INT           NOT NULL,
  product_name   VARCHAR(200)  NOT NULL,  -- snapshot
  product_sku    VARCHAR(100),
  quantity       INT           NOT NULL,
  unit_price     DECIMAL(10,2) NOT NULL,  -- price excl. tax
  tax_rate       DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  tax_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  line_total     DECIMAL(10,2) NOT NULL,  -- (unit_price + item_tax) * qty
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  INDEX idx_oi_order   (order_id),
  INDEX idx_oi_product (product_id)
);

-- ------------------------------------------------------------
-- 7. INVOICES  (1-to-1 with orders)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50)  UNIQUE NOT NULL,
  order_id       INT          NOT NULL UNIQUE,
  generated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_inv_number (invoice_number),
  INDEX idx_inv_date   (generated_at)
);
