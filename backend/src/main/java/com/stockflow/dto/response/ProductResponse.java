package com.stockflow.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String sku;
    private String name;
    private String description;
    private CategoryRef category;
    private SupplierRef primarySupplier;
    private BigDecimal unitCost;
    private BigDecimal sellingPrice;
    private Integer reorderLevel;
    private Integer reorderQuantity;
    private String unitOfMeasure;
    private String barcode;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    // Aggregated from inventory_balances
    private Integer totalQuantity;
    private BigDecimal totalValue;
    private String stockStatus; // IN_STOCK, LOW_STOCK, OUT_OF_STOCK

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CategoryRef {
        private Long id;
        private String name;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SupplierRef {
        private Long id;
        private String name;
        private String code;
    }
}
