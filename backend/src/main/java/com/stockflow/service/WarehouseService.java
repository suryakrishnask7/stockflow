package com.stockflow.service;

import com.stockflow.dto.request.WarehouseRequest;
import com.stockflow.dto.response.WarehouseResponse;
import com.stockflow.entity.Warehouse;
import com.stockflow.exception.*;
import com.stockflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final InventoryBalanceRepository balanceRepository;

    public List<WarehouseResponse> getAllWarehouses() {
        return warehouseRepository.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public WarehouseResponse getWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .map(this::toResponseWithStats)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
    }

    @Transactional
    public WarehouseResponse createWarehouse(WarehouseRequest request) {
        if (warehouseRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Warehouse with code '" + request.getCode() + "' already exists");
        }
        Warehouse warehouse = Warehouse.builder()
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .country(request.getCountry())
                .status(Warehouse.Status.ACTIVE)
                .notes(request.getNotes())
                .build();
        return toResponse(warehouseRepository.save(warehouse));
    }

    @Transactional
    public WarehouseResponse updateWarehouse(Long id, WarehouseRequest request) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
        if (!warehouse.getCode().equals(request.getCode()) &&
            warehouseRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new DuplicateResourceException("Warehouse with code '" + request.getCode() + "' already exists");
        }
        warehouse.setCode(request.getCode().toUpperCase());
        warehouse.setName(request.getName());
        warehouse.setAddressLine1(request.getAddressLine1());
        warehouse.setAddressLine2(request.getAddressLine2());
        warehouse.setCity(request.getCity());
        warehouse.setState(request.getState());
        warehouse.setPostalCode(request.getPostalCode());
        warehouse.setCountry(request.getCountry());
        warehouse.setNotes(request.getNotes());
        return toResponse(warehouseRepository.save(warehouse));
    }

    @Transactional
    public void deactivateWarehouse(Long id) {
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
        warehouse.setStatus(Warehouse.Status.INACTIVE);
        warehouseRepository.save(warehouse);
    }

    private WarehouseResponse toResponse(Warehouse w) {
        return WarehouseResponse.builder()
                .id(w.getId()).code(w.getCode()).name(w.getName())
                .addressLine1(w.getAddressLine1()).addressLine2(w.getAddressLine2())
                .city(w.getCity()).state(w.getState()).postalCode(w.getPostalCode())
                .country(w.getCountry()).status(w.getStatus().name())
                .notes(w.getNotes()).createdAt(w.getCreatedAt()).updatedAt(w.getUpdatedAt())
                .build();
    }

    private WarehouseResponse toResponseWithStats(Warehouse w) {
        var balances = balanceRepository.findByWarehouseIdWithDetails(w.getId());
        int totalUnits = balances.stream().mapToInt(b -> b.getQuantity()).sum();
        BigDecimal totalValue = balances.stream()
                .map(b -> b.getProduct().getUnitCost().multiply(BigDecimal.valueOf(b.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        WarehouseResponse resp = toResponse(w);
        resp.setProductCount(balances.size());
        resp.setTotalUnits(totalUnits);
        resp.setTotalValue(totalValue);
        return resp;
    }
}
