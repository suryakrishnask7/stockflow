package com.stockflow.analytics;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Analytics repository using JdbcTemplate for complex SQL aggregation queries.
 *
 * Design rationale:
 * - JPA/HQL is used for entity CRUD operations (Products, Warehouses, Suppliers, etc.)
 * - JdbcTemplate is used here for multi-table aggregation, GROUP BY reports, and
 *   complex analytical queries where the SQL must be explicit and readable.
 * - All queries are parameterized to prevent SQL injection.
 * - BigDecimal is used for all monetary calculations.
 */
@Repository
@RequiredArgsConstructor
@Slf4j
public class AnalyticsRepository {

    private final JdbcTemplate jdbc;

    /**
     * Inventory value by warehouse.
     * Query: Aggregates inventory_balances joined with products to compute
     * per-warehouse value = SUM(quantity * unit_cost).
     * Uses a single scan of inventory_balances to avoid double-counting.
     */
    public List<AnalyticsData.WarehouseValue> getWarehouseValues() {
        String sql = """
            SELECT
                w.id            AS warehouse_id,
                w.code          AS warehouse_code,
                w.name          AS warehouse_name,
                SUM(ib.quantity * p.unit_cost) AS total_value,
                SUM(ib.quantity)               AS total_units,
                COUNT(DISTINCT ib.product_id)  AS product_count
            FROM inventory_balances ib
            JOIN products p   ON p.id = ib.product_id
            JOIN warehouses w ON w.id = ib.warehouse_id
            WHERE w.status = 'ACTIVE'
            GROUP BY w.id, w.code, w.name
            ORDER BY total_value DESC
            """;

        return jdbc.query(sql, (rs, row) -> AnalyticsData.WarehouseValue.builder()
                .warehouseId(rs.getLong("warehouse_id"))
                .warehouseCode(rs.getString("warehouse_code"))
                .warehouseName(rs.getString("warehouse_name"))
                .totalValue(rs.getBigDecimal("total_value"))
                .totalUnits(rs.getLong("total_units"))
                .productCount(rs.getLong("product_count"))
                .build());
    }

    /**
     * Inventory value by category.
     * Correctly aggregates across all warehouses without double-counting:
     * each inventory_balance record is one (product, warehouse) combination.
     */
    public List<AnalyticsData.CategoryValue> getCategoryValues() {
        String sql = """
            SELECT
                c.id    AS category_id,
                c.name  AS category_name,
                SUM(ib.quantity * p.unit_cost) AS total_value,
                SUM(ib.quantity)               AS total_units,
                COUNT(DISTINCT p.id)           AS product_count
            FROM inventory_balances ib
            JOIN products   p ON p.id = ib.product_id
            JOIN categories c ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY total_value DESC
            """;

        return jdbc.query(sql, (rs, row) -> AnalyticsData.CategoryValue.builder()
                .categoryId(rs.getLong("category_id"))
                .categoryName(rs.getString("category_name"))
                .totalValue(rs.getBigDecimal("total_value"))
                .totalUnits(rs.getLong("total_units"))
                .productCount(rs.getLong("product_count"))
                .build());
    }

    /**
     * Stock movement volume by date (daily) within a date range.
     * Pivots movement types into columns for trend analysis.
     * Uses FILTER clause (PostgreSQL 9.4+) for clean conditional aggregation.
     */
    public List<AnalyticsData.MovementTrend> getMovementTrends(LocalDate from, LocalDate to, Long warehouseId) {
        String warehouseFilter = (warehouseId != null)
                ? "AND (sm.source_warehouse_id = ? OR sm.dest_warehouse_id = ?)"
                : "";
        String sql = """
            SELECT
                DATE(sm.created_at AT TIME ZONE 'UTC')  AS movement_date,
                SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'RECEIPT')     AS receipt_qty,
                SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'ISSUE')       AS issue_qty,
                SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'RETURN')      AS return_qty,
                SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'TRANSFER')    AS transfer_qty,
                SUM(sm.quantity) FILTER (WHERE sm.movement_type = 'ADJUSTMENT')  AS adjustment_qty,
                COUNT(*)                                                          AS total_movements
            FROM stock_movements sm
            WHERE sm.created_at >= ?::timestamptz
              AND sm.created_at < (?::date + INTERVAL '1 day')::timestamptz
              AND sm.status = 'COMPLETED'
            """ + warehouseFilter + """
            GROUP BY DATE(sm.created_at AT TIME ZONE 'UTC')
            ORDER BY movement_date
            """;

        if (warehouseId != null) {
            return jdbc.query(sql, (rs, row) -> buildTrend(rs),
                    from.toString(), to.toString(), warehouseId, warehouseId);
        }
        return jdbc.query(sql, (rs, row) -> buildTrend(rs), from.toString(), to.toString());
    }

    /**
     * Top products by outbound (ISSUE) quantity.
     * Only counts ISSUE movements to represent actual demand/consumption.
     */
    public List<AnalyticsData.TopProduct> getTopProductsByOutbound(LocalDate from, LocalDate to,
                                                                     Long warehouseId, int limit) {
        String warehouseFilter = (warehouseId != null) ? "AND sm.source_warehouse_id = ?" : "";
        String sql = """
            SELECT
                p.id        AS product_id,
                p.sku       AS product_sku,
                p.name      AS product_name,
                c.name      AS category_name,
                SUM(sm.quantity)          AS total_outbound_qty,
                COUNT(sm.id)              AS movement_count,
                SUM(sm.quantity * p.unit_cost) AS total_value
            FROM stock_movements sm
            JOIN products   p ON p.id = sm.product_id
            JOIN categories c ON c.id = p.category_id
            WHERE sm.movement_type = 'ISSUE'
              AND sm.status = 'COMPLETED'
              AND sm.created_at >= ?::timestamptz
              AND sm.created_at < (?::date + INTERVAL '1 day')::timestamptz
            """ + warehouseFilter + """
            GROUP BY p.id, p.sku, p.name, c.name
            ORDER BY total_outbound_qty DESC
            LIMIT ?
            """;

        Object[] params = warehouseId != null
                ? new Object[]{from.toString(), to.toString(), warehouseId, limit}
                : new Object[]{from.toString(), to.toString(), limit};

        return jdbc.query(sql, (rs, row) -> AnalyticsData.TopProduct.builder()
                .productId(rs.getLong("product_id"))
                .productSku(rs.getString("product_sku"))
                .productName(rs.getString("product_name"))
                .categoryName(rs.getString("category_name"))
                .totalOutboundQty(rs.getLong("total_outbound_qty"))
                .movementCount(rs.getLong("movement_count"))
                .totalValue(rs.getBigDecimal("total_value"))
                .build(), params);
    }

    /**
     * Slow-moving products: products with no ISSUE movement in the last N days.
     * Uses LEFT JOIN to identify products with no recent activity.
     */
    public List<AnalyticsData.SlowMovingProduct> getSlowMovingProducts(int inactiveDays, Long warehouseId) {
        String warehouseFilter = (warehouseId != null) ? "AND ib.warehouse_id = ?" : "";
        String sql = """
            SELECT
                p.id                AS product_id,
                p.sku               AS product_sku,
                p.name              AS product_name,
                c.name              AS category_name,
                COALESCE(
                    EXTRACT(DAY FROM (NOW() - MAX(sm.created_at))),
                    ?
                )                   AS days_since_last_movement,
                COALESCE(SUM(ib.quantity), 0)            AS current_stock,
                COALESCE(SUM(ib.quantity * p.unit_cost), 0) AS inventory_value
            FROM products p
            JOIN categories c ON c.id = p.category_id
            LEFT JOIN inventory_balances ib ON ib.product_id = p.id
            LEFT JOIN stock_movements sm ON sm.product_id = p.id
                AND sm.movement_type = 'ISSUE'
                AND sm.status = 'COMPLETED'
                AND sm.created_at > NOW() - (? || ' days')::INTERVAL
            WHERE p.status = 'ACTIVE'
            """ + warehouseFilter + """
            GROUP BY p.id, p.sku, p.name, c.name
            HAVING MAX(sm.created_at) IS NULL
                OR MAX(sm.created_at) < NOW() - (? || ' days')::INTERVAL
            ORDER BY days_since_last_movement DESC
            LIMIT 50
            """;

        Object[] params = warehouseId != null
                ? new Object[]{inactiveDays, inactiveDays, warehouseId, inactiveDays}
                : new Object[]{inactiveDays, inactiveDays, inactiveDays};

        return jdbc.query(sql, (rs, row) -> AnalyticsData.SlowMovingProduct.builder()
                .productId(rs.getLong("product_id"))
                .productSku(rs.getString("product_sku"))
                .productName(rs.getString("product_name"))
                .categoryName(rs.getString("category_name"))
                .daysSinceLastMovement(rs.getLong("days_since_last_movement"))
                .currentStock(rs.getInt("current_stock"))
                .inventoryValue(rs.getBigDecimal("inventory_value"))
                .build(), params);
    }

    /**
     * Adjustment movements report for discrepancy analysis.
     * Only returns ADJUSTMENT type movements for review.
     */
    public List<AnalyticsData.StockAdjustment> getStockAdjustments(LocalDate from, LocalDate to) {
        String sql = """
            SELECT
                sm.id                               AS movement_id,
                sm.reference_number                 AS reference_number,
                p.sku                               AS product_sku,
                p.name                              AS product_name,
                COALESCE(dw.name, sw.name)          AS warehouse_name,
                sm.quantity                         AS quantity,
                sm.reason                           AS reason,
                u.full_name                         AS performed_by,
                TO_CHAR(sm.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS adjustment_date
            FROM stock_movements sm
            JOIN products  p ON p.id = sm.product_id
            JOIN users     u ON u.id = sm.performed_by
            LEFT JOIN warehouses dw ON dw.id = sm.dest_warehouse_id
            LEFT JOIN warehouses sw ON sw.id = sm.source_warehouse_id
            WHERE sm.movement_type = 'ADJUSTMENT'
              AND sm.created_at >= ?::timestamptz
              AND sm.created_at < (?::date + INTERVAL '1 day')::timestamptz
            ORDER BY sm.created_at DESC
            """;

        return jdbc.query(sql, (rs, row) -> AnalyticsData.StockAdjustment.builder()
                .movementId(rs.getLong("movement_id"))
                .referenceNumber(rs.getString("reference_number"))
                .productSku(rs.getString("product_sku"))
                .productName(rs.getString("product_name"))
                .warehouseName(rs.getString("warehouse_name"))
                .quantity(rs.getInt("quantity"))
                .reason(rs.getString("reason"))
                .performedBy(rs.getString("performed_by"))
                .adjustmentDate(rs.getString("adjustment_date"))
                .build(), from.toString(), to.toString());
    }

    private AnalyticsData.MovementTrend buildTrend(java.sql.ResultSet rs) throws java.sql.SQLException {
        return AnalyticsData.MovementTrend.builder()
                .date(rs.getString("movement_date"))
                .receiptQty(rs.getLong("receipt_qty"))
                .issueQty(rs.getLong("issue_qty"))
                .returnQty(rs.getLong("return_qty"))
                .transferQty(rs.getLong("transfer_qty"))
                .adjustmentQty(rs.getLong("adjustment_qty"))
                .totalMovements(rs.getLong("total_movements"))
                .build();
    }
}
