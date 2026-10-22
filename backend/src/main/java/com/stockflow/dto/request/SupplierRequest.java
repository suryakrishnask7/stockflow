package com.stockflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SupplierRequest {

    @NotBlank(message = "Supplier code is required")
    @Size(max = 20)
    @Pattern(regexp = "^[A-Z0-9\\-]+$", message = "Code must contain only uppercase letters, numbers, and hyphens")
    private String code;

    @NotBlank(message = "Supplier name is required")
    @Size(max = 255)
    private String name;

    @Size(max = 255)
    private String contactPerson;

    @Email(message = "Invalid email format")
    @Size(max = 255)
    private String email;

    @Size(max = 50)
    private String phone;

    @Size(max = 255)
    private String addressLine1;

    @Size(max = 255)
    private String addressLine2;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 20)
    private String postalCode;

    @Size(max = 100)
    private String country = "USA";

    private String notes;
}
