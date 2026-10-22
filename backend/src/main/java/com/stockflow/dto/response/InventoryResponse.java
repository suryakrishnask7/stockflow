package com.stockflow.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InventoryResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private String categoryName;
    private Long warehouseId;
    private String warehouseCode;
    private String warehouseName;
    private Integer quantity;
    private Integer reservedQty;
    private Integer availableQty;
    private Integer reorderLevel;
    private BigDecimal unitCost;
    private BigDecimal inventoryValue;
    private String stockStatus; // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
    private Instant lastMovementAt;
    private Instant updatedAt;
}
