package com.stockflow.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WarehouseResponse {
    private Long id;
    private String code;
    private String name;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String status;
    private String notes;
    private Integer productCount;
    private Integer totalUnits;
    private BigDecimal totalValue;
    private Instant createdAt;
    private Instant updatedAt;
}
