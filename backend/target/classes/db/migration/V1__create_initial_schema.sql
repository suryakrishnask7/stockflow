-- V1__create_initial_schema.sql
-- StockFlow Initial Schema
-- Establishes all core tables with constraints, indexes, and data integrity rules.
-- Uses DECIMAL for monetary values, TIMESTAMPTZ for timezone-aware timestamps.

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE roles (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    username        VARCHAR(100)    NOT NULL UNIQUE,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(255)    NOT NULL,
    role_id         BIGINT          NOT NULL REFERENCES roles(id),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);

-- ============================================================
-- REFRESH TOKENS TABLE
-- ============================================================
CREATE TABLE refresh_tokens (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(512)    NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ     NOT NULL,
    revoked     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    description VARCHAR(500),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WAREHOUSES TABLE
-- ============================================================
CREATE TABLE warehouses (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(20)     NOT NULL UNIQUE,
    name            VARCHAR(255)    NOT NULL,
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    country         VARCHAR(100)    DEFAULT 'USA',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_status ON warehouses(status);

-- ============================================================
-- SUPPLIERS TABLE
-- ============================================================
CREATE TABLE suppliers (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(20)     NOT NULL UNIQUE,
    name            VARCHAR(255)    NOT NULL,
    contact_person  VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    country         VARCHAR(100)    DEFAULT 'USA',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_suppliers_name ON suppliers USING gin(name gin_trgm_ops);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
    id              BIGSERIAL           PRIMARY KEY,
    sku             VARCHAR(100)        NOT NULL UNIQUE,
    name            VARCHAR(255)        NOT NULL,
    description     TEXT,
    category_id     BIGINT              NOT NULL REFERENCES categories(id),
    primary_supplier_id BIGINT          REFERENCES suppliers(id),
    unit_cost       DECIMAL(15, 4)      NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    selling_price   DECIMAL(15, 4)      CHECK (selling_price >= 0),
    reorder_level   INTEGER             NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    reorder_quantity INTEGER             DEFAULT 0 CHECK (reorder_quantity >= 0),
    unit_of_measure VARCHAR(50)         DEFAULT 'Each',
    barcode         VARCHAR(100),
    weight_kg       DECIMAL(10, 4),
    status          VARCHAR(20)         NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'ARCHIVED')),
    created_by      BIGINT              REFERENCES users(id),
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_primary_supplier_id ON products(primary_supplier_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_sku_trgm ON products USING gin(sku gin_trgm_ops);

-- ============================================================
-- PRODUCT-SUPPLIER ASSOCIATION TABLE
-- ============================================================
CREATE TABLE product_suppliers (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id     BIGINT          NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_sku    VARCHAR(100),
    unit_cost       DECIMAL(15, 4)  CHECK (unit_cost >= 0),
    lead_time_days  INTEGER         CHECK (lead_time_days >= 0),
    is_primary      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, supplier_id)
);

CREATE INDEX idx_product_suppliers_product_id ON product_suppliers(product_id);
CREATE INDEX idx_product_suppliers_supplier_id ON product_suppliers(supplier_id);

-- ============================================================
-- INVENTORY BALANCES TABLE
-- Represents the current operational stock level.
-- One record per (product, warehouse) combination.
-- ============================================================
CREATE TABLE inventory_balances (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL REFERENCES products(id),
    warehouse_id    BIGINT          NOT NULL REFERENCES warehouses(id),
    quantity        INTEGER         NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_qty    INTEGER         NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
    last_movement_at TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, warehouse_id)
);

CREATE INDEX idx_inventory_balances_product_id ON inventory_balances(product_id);
CREATE INDEX idx_inventory_balances_warehouse_id ON inventory_balances(warehouse_id);
CREATE INDEX idx_inventory_balances_quantity ON inventory_balances(quantity);

-- ============================================================
-- STOCK MOVEMENTS TABLE (THE LEDGER)
-- Immutable historical record. Never deleted or updated.
-- ============================================================
CREATE TABLE stock_movements (
    id                  BIGSERIAL       PRIMARY KEY,
    reference_number    VARCHAR(100)    NOT NULL UNIQUE,
    idempotency_key     VARCHAR(255)    UNIQUE,
    movement_type       VARCHAR(20)     NOT NULL
                        CHECK (movement_type IN ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT', 'RETURN')),
    product_id          BIGINT          NOT NULL REFERENCES products(id),
    source_warehouse_id BIGINT          REFERENCES warehouses(id),
    dest_warehouse_id   BIGINT          REFERENCES warehouses(id),
    quantity            INTEGER         NOT NULL CHECK (quantity > 0),
    unit_cost           DECIMAL(15, 4),
    total_value         DECIMAL(15, 4),
    reason              TEXT,
    external_reference  VARCHAR(255),
    supplier_id         BIGINT          REFERENCES suppliers(id),
    performed_by        BIGINT          NOT NULL REFERENCES users(id),
    notes               TEXT,
    status              VARCHAR(20)     NOT NULL DEFAULT 'COMPLETED'
                        CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED')),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    -- Transfer constraint: source and destination must differ
    CONSTRAINT chk_transfer_warehouses CHECK (
        movement_type != 'TRANSFER' OR (source_warehouse_id IS NOT NULL AND dest_warehouse_id IS NOT NULL AND source_warehouse_id != dest_warehouse_id)
    ),
    -- Receipt/Return must have a destination
    CONSTRAINT chk_receipt_dest CHECK (
        movement_type NOT IN ('RECEIPT', 'RETURN') OR dest_warehouse_id IS NOT NULL
    ),
    -- Issue must have a source
    CONSTRAINT chk_issue_source CHECK (
        movement_type != 'ISSUE' OR source_warehouse_id IS NOT NULL
    )
);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_source_warehouse ON stock_movements(source_warehouse_id);
CREATE INDEX idx_stock_movements_dest_warehouse ON stock_movements(dest_warehouse_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_performed_by ON stock_movements(performed_by);
CREATE INDEX idx_stock_movements_supplier_id ON stock_movements(supplier_id);
CREATE INDEX idx_stock_movements_ref_num ON stock_movements(reference_number);

-- ============================================================
-- AUDIT EVENTS TABLE
-- Records user-initiated operations on key entities.
-- ============================================================
CREATE TABLE audit_events (
    id              BIGSERIAL       PRIMARY KEY,
    event_type      VARCHAR(100)    NOT NULL,
    entity_type     VARCHAR(100)    NOT NULL,
    entity_id       VARCHAR(100),
    performed_by    BIGINT          REFERENCES users(id),
    ip_address      VARCHAR(50),
    user_agent      VARCHAR(500),
    details         TEXT,
    old_values      TEXT,
    new_values      TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_events_performed_by ON audit_events(performed_by);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
