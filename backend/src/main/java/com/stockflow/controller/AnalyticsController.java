package com.stockflow.controller;

import com.stockflow.analytics.AnalyticsData;
import com.stockflow.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Warehouse stock distribution, movement trends, and top turnover products")
public class AnalyticsController {

    private final DashboardService dashboardService;

    @GetMapping("/warehouse-values")
    @Operation(summary = "Get total inventory valuation and SKU count breakdown by warehouse")
    public ResponseEntity<List<AnalyticsData.WarehouseValue>> getWarehouseValues() {
        return ResponseEntity.ok(dashboardService.getWarehouseValues());
    }

    @GetMapping("/movement-trends")
    @Operation(summary = "Get historical daily movement trends (inbound vs outbound) with optional date filtering")
    public ResponseEntity<List<AnalyticsData.MovementTrend>> getMovementTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long warehouseId) {
        if (to == null) to = LocalDate.now();
        if (from == null) from = to.minusDays(30);
        return ResponseEntity.ok(dashboardService.getMovementTrends(from, to, warehouseId));
    }

    @GetMapping("/top-products")
    @Operation(summary = "Get top moving outbound products by dispatched units")
    public ResponseEntity<List<AnalyticsData.TopProduct>> getTopProducts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(defaultValue = "10") int limit) {
        if (to == null) to = LocalDate.now();
        if (from == null) from = to.minusDays(30);
        return ResponseEntity.ok(dashboardService.getTopProducts(from, to, warehouseId, limit));
    }
}
