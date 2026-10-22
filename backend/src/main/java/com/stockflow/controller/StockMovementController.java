package com.stockflow.controller;

import com.stockflow.dto.request.StockMovementRequest;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.dto.response.StockMovementResponse;
import com.stockflow.entity.User;
import com.stockflow.service.StockMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
@RequiredArgsConstructor
@Tag(name = "Stock Movements", description = "Inventory transactions: receipts, issues, transfers, adjustments, returns")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    @GetMapping
    @Operation(summary = "Search stock movement history with filters and pagination")
    public ResponseEntity<PageResponse<StockMovementResponse>> searchMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toDate,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(stockMovementService.searchMovements(productId, warehouseId, type, fromDate, toDate, pageable));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent stock movements for feeds or dashboards")
    public ResponseEntity<List<StockMovementResponse>> getRecentMovements(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(stockMovementService.getRecentMovements(limit));
    }

    @PostMapping("/receipt")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Record incoming stock receipt from supplier or purchase")
    public ResponseEntity<StockMovementResponse> recordReceipt(
            @Valid @RequestBody StockMovementRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockMovementService.receipt(request, currentUser));
    }

    @PostMapping("/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Record outbound stock issue / order dispatch")
    public ResponseEntity<StockMovementResponse> recordIssue(
            @Valid @RequestBody StockMovementRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockMovementService.issue(request, currentUser));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Transfer stock between two warehouses atomically")
    public ResponseEntity<StockMovementResponse> recordTransfer(
            @Valid @RequestBody StockMovementRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockMovementService.transfer(request, currentUser));
    }

    @PostMapping("/adjustment")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Adjust inventory count with mandatory audit reason")
    public ResponseEntity<StockMovementResponse> recordAdjustment(
            @Valid @RequestBody StockMovementRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockMovementService.adjustment(request, currentUser));
    }

    @PostMapping("/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    @Operation(summary = "Record customer or order return to inventory")
    public ResponseEntity<StockMovementResponse> recordReturn(
            @Valid @RequestBody StockMovementRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockMovementService.stockReturn(request, currentUser));
    }
}
