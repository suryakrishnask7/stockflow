package com.stockflow.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StockMovementResponse {
    private Long id;
    private String referenceNumber;
    private String movementType;
    private ProductRef product;
    private WarehouseRef sourceWarehouse;
    private WarehouseRef destWarehouse;
    private Integer quantity;
    private BigDecimal unitCost;
    private BigDecimal totalValue;
    private String reason;
    private String externalReference;
    private SupplierRef supplier;
    private UserRef performedBy;
    private String notes;
    private String status;
    private Instant createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ProductRef {
        private Long id;
        private String sku;
        private String name;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WarehouseRef {
        private Long id;
        private String code;
        private String name;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SupplierRef {
        private Long id;
        private String name;
        private String code;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserRef {
        private Long id;
        private String username;
        private String fullName;
    }
}
