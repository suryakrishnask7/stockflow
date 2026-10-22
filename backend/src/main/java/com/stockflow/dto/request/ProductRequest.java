package com.stockflow.dto.request;

import com.stockflow.entity.Product;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "SKU is required")
    @Size(max = 100, message = "SKU must not exceed 100 characters")
    @Pattern(regexp = "^[A-Z0-9\\-]+$", message = "SKU must contain only uppercase letters, numbers, and hyphens")
    private String sku;

    @NotBlank(message = "Product name is required")
    @Size(max = 255, message = "Product name must not exceed 255 characters")
    private String name;

    private String description;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private Long primarySupplierId;

    @NotNull(message = "Unit cost is required")
    @DecimalMin(value = "0.00", message = "Unit cost cannot be negative")
    @Digits(integer = 11, fraction = 4, message = "Invalid unit cost format")
    private BigDecimal unitCost;

    @DecimalMin(value = "0.00", message = "Selling price cannot be negative")
    @Digits(integer = 11, fraction = 4, message = "Invalid selling price format")
    private BigDecimal sellingPrice;

    @NotNull(message = "Reorder level is required")
    @Min(value = 0, message = "Reorder level cannot be negative")
    private Integer reorderLevel = 0;

    @Min(value = 0, message = "Reorder quantity cannot be negative")
    private Integer reorderQuantity = 0;

    @Size(max = 50)
    private String unitOfMeasure = "Each";

    @Size(max = 100)
    private String barcode;
}
