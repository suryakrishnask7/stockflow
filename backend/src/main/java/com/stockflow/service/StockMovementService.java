package com.stockflow.service;

import com.stockflow.dto.request.StockMovementRequest;
import com.stockflow.dto.response.StockMovementResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.entity.*;
import com.stockflow.exception.*;
import com.stockflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockMovementService {

    private final StockMovementRepository movementRepository;
    private final InventoryBalanceRepository balanceRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final SupplierRepository supplierRepository;

    @Value("${stockflow.inventory.allow-negative-stock:false}")
    private boolean allowNegativeStock;

    // Reference number counter (in production, use a DB sequence)
    private final AtomicInteger seqCounter = new AtomicInteger((int)(System.currentTimeMillis() % 100000));

    // =====================================================
    // RECEIPT — stock enters the warehouse
    // =====================================================
    @Transactional
    public StockMovementResponse receipt(StockMovementRequest request, User currentUser) {
        validateDestWarehouse(request);
        Product product = getProduct(request.getProductId());
        Warehouse destWarehouse = getWarehouse(request.getDestWarehouseId());
        Supplier supplier = request.getSupplierId() != null ? getSupplier(request.getSupplierId()) : null;

        // Idempotency check
        if (request.getIdempotencyKey() != null) {
            Optional<StockMovement> existing = movementRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) return toResponse(existing.get());
        }

        // Add to destination balance
        InventoryBalance balance = getOrCreateBalance(product, destWarehouse);
        balance.setQuantity(balance.getQuantity() + request.getQuantity());
        balance.setLastMovementAt(Instant.now());
        balanceRepository.save(balance);

        BigDecimal unitCost = request.getUnitCost() != null ? request.getUnitCost() : product.getUnitCost();
        StockMovement movement = buildMovement(request, product, null, destWarehouse, supplier,
                currentUser, StockMovement.MovementType.RECEIPT, unitCost);
        movement = movementRepository.save(movement);

        log.info("RECEIPT: {} x {} at {} by {}", request.getQuantity(), product.getSku(),
                destWarehouse.getCode(), currentUser.getUsername());
        return toResponse(movement);
    }

    // =====================================================
    // ISSUE — stock leaves the warehouse
    // =====================================================
    @Transactional
    public StockMovementResponse issue(StockMovementRequest request, User currentUser) {
        validateSourceWarehouse(request);
        Product product = getProduct(request.getProductId());
        Warehouse sourceWarehouse = getWarehouse(request.getSourceWarehouseId());

        if (request.getIdempotencyKey() != null) {
            Optional<StockMovement> existing = movementRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) return toResponse(existing.get());
        }

        // Pessimistic lock to prevent concurrent overselling
        InventoryBalance balance = balanceRepository
                .findByProductIdAndWarehouseIdForUpdate(product.getId(), sourceWarehouse.getId())
                .orElseThrow(() -> new InsufficientStockException(
                        "No stock record for product " + product.getSku() + " at " + sourceWarehouse.getCode()));

        if (!allowNegativeStock && balance.getQuantity() < request.getQuantity()) {
            throw new InsufficientStockException(product.getSku(), sourceWarehouse.getCode(),
                    request.getQuantity(), balance.getQuantity());
        }

        balance.setQuantity(balance.getQuantity() - request.getQuantity());
        balance.setLastMovementAt(Instant.now());
        balanceRepository.save(balance);

        StockMovement movement = buildMovement(request, product, sourceWarehouse, null, null,
                currentUser, StockMovement.MovementType.ISSUE, product.getUnitCost());
        movement = movementRepository.save(movement);

        log.info("ISSUE: {} x {} from {} by {}", request.getQuantity(), product.getSku(),
                sourceWarehouse.getCode(), currentUser.getUsername());
        return toResponse(movement);
    }

    // =====================================================
    // TRANSFER — stock moves between warehouses (atomic)
    // =====================================================
    @Transactional
    public StockMovementResponse transfer(StockMovementRequest request, User currentUser) {
        validateSourceWarehouse(request);
        validateDestWarehouse(request);
        if (request.getSourceWarehouseId().equals(request.getDestWarehouseId())) {
            throw new BusinessException("Source and destination warehouses must be different for transfers");
        }

        Product product = getProduct(request.getProductId());
        Warehouse sourceWarehouse = getWarehouse(request.getSourceWarehouseId());
        Warehouse destWarehouse = getWarehouse(request.getDestWarehouseId());

        if (request.getIdempotencyKey() != null) {
            Optional<StockMovement> existing = movementRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) return toResponse(existing.get());
        }

        // Pessimistic lock on source — prevents concurrent transfer overselling
        InventoryBalance sourceBalance = balanceRepository
                .findByProductIdAndWarehouseIdForUpdate(product.getId(), sourceWarehouse.getId())
                .orElseThrow(() -> new InsufficientStockException(
                        "No stock for " + product.getSku() + " at " + sourceWarehouse.getCode()));

        if (!allowNegativeStock && sourceBalance.getQuantity() < request.getQuantity()) {
            throw new InsufficientStockException(product.getSku(), sourceWarehouse.getCode(),
                    request.getQuantity(), sourceBalance.getQuantity());
        }

        // Deduct source
        sourceBalance.setQuantity(sourceBalance.getQuantity() - request.getQuantity());
        sourceBalance.setLastMovementAt(Instant.now());
        balanceRepository.save(sourceBalance);

        // Add to destination
        InventoryBalance destBalance = getOrCreateBalance(product, destWarehouse);
        destBalance.setQuantity(destBalance.getQuantity() + request.getQuantity());
        destBalance.setLastMovementAt(Instant.now());
        balanceRepository.save(destBalance);

        StockMovement movement = buildMovement(request, product, sourceWarehouse, destWarehouse, null,
                currentUser, StockMovement.MovementType.TRANSFER, product.getUnitCost());
        movement = movementRepository.save(movement);

        log.info("TRANSFER: {} x {} from {} to {} by {}", request.getQuantity(), product.getSku(),
                sourceWarehouse.getCode(), destWarehouse.getCode(), currentUser.getUsername());
        return toResponse(movement);
    }

    // =====================================================
    // ADJUSTMENT — authorized stock correction
    // =====================================================
    @Transactional
    public StockMovementResponse adjustment(StockMovementRequest request, User currentUser) {
        validateDestWarehouse(request);
        Product product = getProduct(request.getProductId());
        Warehouse warehouse = getWarehouse(request.getDestWarehouseId());

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BusinessException("Reason is mandatory for stock adjustments");
        }

        InventoryBalance balance = getOrCreateBalance(product, warehouse);
        balance.setQuantity(balance.getQuantity() + request.getQuantity());
        balance.setLastMovementAt(Instant.now());
        balanceRepository.save(balance);

        StockMovement movement = buildMovement(request, product, null, warehouse, null,
                currentUser, StockMovement.MovementType.ADJUSTMENT, product.getUnitCost());
        movement = movementRepository.save(movement);

        log.info("ADJUSTMENT: {} x {} at {} by {} (reason: {})", request.getQuantity(), product.getSku(),
                warehouse.getCode(), currentUser.getUsername(), request.getReason());
        return toResponse(movement);
    }

    // =====================================================
    // RETURN — eligible stock returns
    // =====================================================
    @Transactional
    public StockMovementResponse stockReturn(StockMovementRequest request, User currentUser) {
        validateDestWarehouse(request);
        Product product = getProduct(request.getProductId());
        Warehouse destWarehouse = getWarehouse(request.getDestWarehouseId());

        InventoryBalance balance = getOrCreateBalance(product, destWarehouse);
        balance.setQuantity(balance.getQuantity() + request.getQuantity());
        balance.setLastMovementAt(Instant.now());
        balanceRepository.save(balance);

        StockMovement movement = buildMovement(request, product, null, destWarehouse, null,
                currentUser, StockMovement.MovementType.RETURN, product.getUnitCost());
        movement = movementRepository.save(movement);

        log.info("RETURN: {} x {} to {} by {}", request.getQuantity(), product.getSku(),
                destWarehouse.getCode(), currentUser.getUsername());
        return toResponse(movement);
    }

    // =====================================================
    // QUERY METHODS
    // =====================================================
    @Transactional(readOnly = true)
    public PageResponse<StockMovementResponse> searchMovements(Long productId, Long warehouseId,
                                                               String type, Instant fromDate,
                                                               Instant toDate, Pageable pageable) {
        StockMovement.MovementType typeEnum = null;
        if (type != null && !type.isBlank()) {
            try { typeEnum = StockMovement.MovementType.valueOf(type.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        Page<StockMovement> page = movementRepository.searchMovements(
                productId, warehouseId, typeEnum, fromDate, toDate, pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> getRecentMovements(int limit) {
        return movementRepository.findRecentMovements(PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> getMovementsForProduct(Long productId, int limit) {
        return movementRepository.findByProductIdOrderByCreatedAtDesc(productId,
                        PageRequest.of(0, limit, Sort.by("createdAt").descending()))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // =====================================================
    // HELPERS
    // =====================================================
    private StockMovement buildMovement(StockMovementRequest req, Product product,
                                        Warehouse source, Warehouse dest, Supplier supplier,
                                        User performer, StockMovement.MovementType type,
                                        BigDecimal unitCost) {
        BigDecimal uc = req.getUnitCost() != null ? req.getUnitCost() : unitCost;
        BigDecimal totalValue = uc != null ? uc.multiply(BigDecimal.valueOf(req.getQuantity())) : null;

        return StockMovement.builder()
                .referenceNumber(generateRefNumber(type))
                .idempotencyKey(req.getIdempotencyKey())
                .movementType(type)
                .product(product)
                .sourceWarehouse(source)
                .destWarehouse(dest)
                .quantity(req.getQuantity())
                .unitCost(uc)
                .totalValue(totalValue)
                .reason(req.getReason())
                .externalReference(req.getExternalReference())
                .supplier(supplier)
                .performedBy(performer)
                .notes(req.getNotes())
                .status(StockMovement.Status.COMPLETED)
                .build();
    }

    private String generateRefNumber(StockMovement.MovementType type) {
        String prefix = switch (type) {
            case RECEIPT -> "REC";
            case ISSUE -> "ISS";
            case TRANSFER -> "TRF";
            case ADJUSTMENT -> "ADJ";
            case RETURN -> "RET";
        };
        return prefix + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + String.format("%05d", seqCounter.incrementAndGet());
    }

    private InventoryBalance getOrCreateBalance(Product product, Warehouse warehouse) {
        return balanceRepository.findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseGet(() -> {
                    InventoryBalance nb = new InventoryBalance();
                    nb.setProduct(product);
                    nb.setWarehouse(warehouse);
                    nb.setQuantity(0);
                    nb.setReservedQty(0);
                    return balanceRepository.save(nb);
                });
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private Warehouse getWarehouse(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
    }

    private Supplier getSupplier(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    private void validateSourceWarehouse(StockMovementRequest req) {
        if (req.getSourceWarehouseId() == null) {
            throw new BusinessException("Source warehouse is required for this movement type");
        }
    }

    private void validateDestWarehouse(StockMovementRequest req) {
        if (req.getDestWarehouseId() == null) {
            throw new BusinessException("Destination warehouse is required for this movement type");
        }
    }

    StockMovementResponse toResponse(StockMovement m) {
        return StockMovementResponse.builder()
                .id(m.getId())
                .referenceNumber(m.getReferenceNumber())
                .movementType(m.getMovementType().name())
                .product(m.getProduct() != null ? StockMovementResponse.ProductRef.builder()
                        .id(m.getProduct().getId())
                        .sku(m.getProduct().getSku())
                        .name(m.getProduct().getName())
                        .build() : null)
                .sourceWarehouse(m.getSourceWarehouse() != null ? StockMovementResponse.WarehouseRef.builder()
                        .id(m.getSourceWarehouse().getId())
                        .code(m.getSourceWarehouse().getCode())
                        .name(m.getSourceWarehouse().getName())
                        .build() : null)
                .destWarehouse(m.getDestWarehouse() != null ? StockMovementResponse.WarehouseRef.builder()
                        .id(m.getDestWarehouse().getId())
                        .code(m.getDestWarehouse().getCode())
                        .name(m.getDestWarehouse().getName())
                        .build() : null)
                .quantity(m.getQuantity())
                .unitCost(m.getUnitCost())
                .totalValue(m.getTotalValue())
                .reason(m.getReason())
                .externalReference(m.getExternalReference())
                .supplier(m.getSupplier() != null ? StockMovementResponse.SupplierRef.builder()
                        .id(m.getSupplier().getId())
                        .name(m.getSupplier().getName())
                        .code(m.getSupplier().getCode())
                        .build() : null)
                .performedBy(m.getPerformedBy() != null ? StockMovementResponse.UserRef.builder()
                        .id(m.getPerformedBy().getId())
                        .username(m.getPerformedBy().getUsername())
                        .fullName(m.getPerformedBy().getFullName())
                        .build() : null)
                .notes(m.getNotes())
                .status(m.getStatus().name())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
