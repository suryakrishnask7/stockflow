package com.stockflow.controller;

import com.stockflow.dto.request.ProductRequest;
import com.stockflow.dto.response.InventoryResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.dto.response.StockMovementResponse;
import com.stockflow.entity.User;
import com.stockflow.service.InventoryService;
import com.stockflow.service.ProductService;
import com.stockflow.service.StockMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product catalog management")
public class ProductController {

    private final ProductService productService;
    private final InventoryService inventoryService;
    private final StockMovementService stockMovementService;

    @GetMapping
    @Operation(summary = "Search products with pagination and filters")
    public ResponseEntity<PageResponse<ProductResponse>> searchProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long supplierId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(productService.searchProducts(search, categoryId, status, supplierId, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID with full warehouse inventory breakdown")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Create a new product")
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request, currentUser));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Update an existing product")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Update product status (ACTIVE, INACTIVE, DISCONTINUED)")
    public ResponseEntity<ProductResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(productService.updateStatus(id, status));
    }

    @GetMapping("/{id}/inventory")
    @Operation(summary = "Get inventory balances for a product across all warehouses")
    public ResponseEntity<List<InventoryResponse>> getProductInventory(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getInventoryForProduct(id));
    }

    @GetMapping("/{id}/movements")
    @Operation(summary = "Get recent stock movements for a product")
    public ResponseEntity<List<StockMovementResponse>> getProductMovements(
            @PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(stockMovementService.getMovementsForProduct(id, limit));
    }
}
