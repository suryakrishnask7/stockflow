package com.stockflow.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardSummaryResponse {
    private BigDecimal totalInventoryValue;
    private Long totalUnitsInStock;
    private Long activeProductCount;
    private Long lowStockProductCount;
    private Long outOfStockProductCount;
    private List<AlertItem> alerts;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AlertItem {
        private String type; // LOW_STOCK, OUT_OF_STOCK
        private Long productId;
        private String productSku;
        private String productName;
        private Long warehouseId;
        private String warehouseName;
        private Integer currentQty;
        private Integer reorderLevel;
    }
}
