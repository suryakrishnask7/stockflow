package com.stockflow.controller;

import com.stockflow.dto.response.InventoryResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Current stock balances and inventory levels across warehouses")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    @Operation(summary = "Search current inventory balances with warehouse and stock status filters")
    public ResponseEntity<PageResponse<InventoryResponse>> getInventory(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "product.name", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.searchInventory(warehouseId, categoryId, status, search, pageable));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get all inventory items currently at or below their reorder threshold")
    public ResponseEntity<List<InventoryResponse>> getLowStockItems() {
        return ResponseEntity.ok(inventoryService.getLowStockItems());
    }

    @GetMapping("/out-of-stock")
    @Operation(summary = "Get all inventory items with zero stock quantity")
    public ResponseEntity<List<InventoryResponse>> getOutOfStockItems() {
        return ResponseEntity.ok(inventoryService.getOutOfStockItems());
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get inventory levels for a specific product across all locations")
    public ResponseEntity<List<InventoryResponse>> getInventoryByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getInventoryForProduct(productId));
    }
}
