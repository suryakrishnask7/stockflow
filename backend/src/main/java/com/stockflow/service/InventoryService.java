package com.stockflow.service;

import com.stockflow.dto.response.InventoryResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.entity.InventoryBalance;
import com.stockflow.repository.InventoryBalanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryService {

    private final InventoryBalanceRepository balanceRepository;

    public PageResponse<InventoryResponse> searchInventory(Long warehouseId, Long categoryId,
                                                           String status, String search, Pageable pageable) {
        return PageResponse.from(
                balanceRepository.searchInventory(warehouseId, categoryId, status, search, pageable)
                        .map(this::toResponse));
    }

    public List<InventoryResponse> getInventoryForProduct(Long productId) {
        return balanceRepository.findByProductId(productId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<InventoryResponse> getLowStockItems() {
        return balanceRepository.findLowStockItems().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<InventoryResponse> getOutOfStockItems() {
        return balanceRepository.findOutOfStockItems().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    private InventoryResponse toResponse(InventoryBalance b) {
        String status;
        if (b.getQuantity() == 0) status = "OUT_OF_STOCK";
        else if (b.getQuantity() <= b.getProduct().getReorderLevel()) status = "LOW_STOCK";
        else status = "IN_STOCK";

        BigDecimal value = b.getProduct().getUnitCost().multiply(BigDecimal.valueOf(b.getQuantity()));

        return InventoryResponse.builder()
                .id(b.getId())
                .productId(b.getProduct().getId())
                .productSku(b.getProduct().getSku())
                .productName(b.getProduct().getName())
                .categoryName(b.getProduct().getCategory() != null ? b.getProduct().getCategory().getName() : null)
                .warehouseId(b.getWarehouse().getId())
                .warehouseCode(b.getWarehouse().getCode())
                .warehouseName(b.getWarehouse().getName())
                .quantity(b.getQuantity())
                .reservedQty(b.getReservedQty())
                .availableQty(b.getAvailableQuantity())
                .reorderLevel(b.getProduct().getReorderLevel())
                .unitCost(b.getProduct().getUnitCost())
                .inventoryValue(value)
                .stockStatus(status)
                .lastMovementAt(b.getLastMovementAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
