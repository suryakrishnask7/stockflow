package com.stockflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StockMovementRequest {

    // Common fields
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private BigDecimal unitCost;

    @Size(max = 500, message = "Reason must not exceed 500 characters")
    private String reason;

    @Size(max = 255, message = "External reference must not exceed 255 characters")
    private String externalReference;

    private Long supplierId;
    private String notes;

    // For idempotency (optional client-provided key)
    @Size(max = 255)
    private String idempotencyKey;

    // RECEIPT / RETURN: destination warehouse
    private Long destWarehouseId;

    // ISSUE: source warehouse
    private Long sourceWarehouseId;

    // TRANSFER: both
    // ADJUSTMENT: dest warehouse (positive adjustment) or source warehouse (negative)
}
