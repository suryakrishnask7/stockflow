package com.stockflow.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SupplierResponse {
    private Long id;
    private String code;
    private String name;
    private String contactPerson;
    private String email;
    private String phone;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String status;
    private String notes;
    private Integer productCount;
    private Instant createdAt;
    private Instant updatedAt;
}
