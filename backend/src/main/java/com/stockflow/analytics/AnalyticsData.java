package com.stockflow.analytics;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Analytics data containers.
 * These represent the results of complex SQL aggregation queries
 * executed via JdbcTemplate against PostgreSQL.
 */
public class AnalyticsData {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class InventoryValuation {
        private BigDecimal totalValue;
        private Long totalUnits;
        private Long productCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WarehouseValue {
        private Long warehouseId;
        private String warehouseCode;
        private String warehouseName;
        private BigDecimal totalValue;
        private Long totalUnits;
        private Long productCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryValue {
        private Long categoryId;
        private String categoryName;
        private BigDecimal totalValue;
        private Long totalUnits;
        private Long productCount;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MovementTrend {
        private String date;      // YYYY-MM-DD
        private Long receiptQty;
        private Long issueQty;
        private Long returnQty;
        private Long transferQty;
        private Long adjustmentQty;
        private Long totalMovements;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProduct {
        private Long productId;
        private String productSku;
        private String productName;
        private String categoryName;
        private Long totalOutboundQty;
        private Long movementCount;
        private BigDecimal totalValue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SlowMovingProduct {
        private Long productId;
        private String productSku;
        private String productName;
        private String categoryName;
        private Long daysSinceLastMovement;
        private Integer currentStock;
        private BigDecimal inventoryValue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StockAdjustment {
        private Long movementId;
        private String referenceNumber;
        private String productSku;
        private String productName;
        private String warehouseName;
        private Integer quantity;
        private String reason;
        private String performedBy;
        private String adjustmentDate;
    }
}
