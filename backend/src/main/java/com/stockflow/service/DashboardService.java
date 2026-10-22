package com.stockflow.service;

import com.stockflow.analytics.AnalyticsData;
import com.stockflow.analytics.AnalyticsRepository;
import com.stockflow.dto.response.DashboardSummaryResponse;
import com.stockflow.entity.InventoryBalance;
import com.stockflow.repository.InventoryBalanceRepository;
import com.stockflow.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final InventoryBalanceRepository balanceRepository;
    private final ProductRepository productRepository;
    private final AnalyticsRepository analyticsRepository;

    public DashboardSummaryResponse getSummary() {
        BigDecimal totalValue = balanceRepository.calculateTotalInventoryValue();
        Long totalUnits = balanceRepository.calculateTotalUnits();
        long activeProducts = productRepository.countByStatus(com.stockflow.entity.Product.Status.ACTIVE);
        long lowStock = balanceRepository.countLowStockProducts();
        long outOfStock = balanceRepository.countOutOfStockProducts();

        // Build alert list from low + out-of-stock items
        List<InventoryBalance> lowStockItems = balanceRepository.findLowStockItems();
        List<InventoryBalance> outOfStockItems = balanceRepository.findOutOfStockItems();

        List<DashboardSummaryResponse.AlertItem> alerts = lowStockItems.stream()
                .map(ib -> buildAlert("LOW_STOCK", ib)).collect(Collectors.toList());
        outOfStockItems.forEach(ib -> alerts.add(buildAlert("OUT_OF_STOCK", ib)));

        return DashboardSummaryResponse.builder()
                .totalInventoryValue(totalValue != null ? totalValue : BigDecimal.ZERO)
                .totalUnitsInStock(totalUnits != null ? totalUnits : 0L)
                .activeProductCount(activeProducts)
                .lowStockProductCount(lowStock)
                .outOfStockProductCount(outOfStock)
                .alerts(alerts)
                .build();
    }

    public List<AnalyticsData.WarehouseValue> getWarehouseValues() {
        return analyticsRepository.getWarehouseValues();
    }

    public List<AnalyticsData.MovementTrend> getMovementTrends(LocalDate from, LocalDate to, Long warehouseId) {
        return analyticsRepository.getMovementTrends(from, to, warehouseId);
    }

    public List<AnalyticsData.TopProduct> getTopProducts(LocalDate from, LocalDate to, Long warehouseId, int limit) {
        return analyticsRepository.getTopProductsByOutbound(from, to, warehouseId, limit);
    }

    private DashboardSummaryResponse.AlertItem buildAlert(String type, InventoryBalance ib) {
        return DashboardSummaryResponse.AlertItem.builder()
                .type(type)
                .productId(ib.getProduct().getId())
                .productSku(ib.getProduct().getSku())
                .productName(ib.getProduct().getName())
                .warehouseId(ib.getWarehouse().getId())
                .warehouseName(ib.getWarehouse().getName())
                .currentQty(ib.getQuantity())
                .reorderLevel(ib.getProduct().getReorderLevel())
                .build();
    }
}
