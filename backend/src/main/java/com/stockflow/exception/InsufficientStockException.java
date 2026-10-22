package com.stockflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
    public InsufficientStockException(String productSku, String warehouseCode, int requested, int available) {
        super(String.format("Insufficient stock for %s at %s: requested %d, available %d",
                productSku, warehouseCode, requested, available));
    }
}
