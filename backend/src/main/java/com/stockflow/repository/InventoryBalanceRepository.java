package com.stockflow.repository;

import com.stockflow.entity.InventoryBalance;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryBalanceRepository extends JpaRepository<InventoryBalance, Long> {

    Optional<InventoryBalance> findByProductIdAndWarehouseId(Long productId, Long warehouseId);

    /**
     * Pessimistic write lock for concurrent stock operations.
     * Prevents concurrent transactions from reading stale balances.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ib FROM InventoryBalance ib WHERE ib.product.id = :productId AND ib.warehouse.id = :warehouseId")
    Optional<InventoryBalance> findByProductIdAndWarehouseIdForUpdate(
            @Param("productId") Long productId,
            @Param("warehouseId") Long warehouseId);

    List<InventoryBalance> findByProductId(Long productId);

    @Query("SELECT ib FROM InventoryBalance ib " +
           "JOIN FETCH ib.product p " +
           "JOIN FETCH p.category " +
           "JOIN FETCH ib.warehouse " +
           "WHERE ib.warehouse.id = :warehouseId " +
           "ORDER BY p.name")
    List<InventoryBalance> findByWarehouseIdWithDetails(Long warehouseId);

    @Query("SELECT ib FROM InventoryBalance ib " +
           "JOIN FETCH ib.product p " +
           "JOIN FETCH p.category " +
           "JOIN FETCH ib.warehouse w " +
           "WHERE (:warehouseId IS NULL OR w.id = :warehouseId) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:status IS NULL OR CASE " +
           "  WHEN ib.quantity = 0 THEN 'OUT_OF_STOCK' " +
           "  WHEN ib.quantity <= p.reorderLevel THEN 'LOW_STOCK' " +
           "  ELSE 'IN_STOCK' END = :status) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<InventoryBalance> searchInventory(
            @Param("warehouseId") Long warehouseId,
            @Param("categoryId") Long categoryId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);

    @Query("SELECT ib FROM InventoryBalance ib " +
           "JOIN FETCH ib.product p " +
           "JOIN FETCH ib.warehouse " +
           "WHERE ib.quantity <= p.reorderLevel AND ib.quantity > 0")
    List<InventoryBalance> findLowStockItems();

    @Query("SELECT ib FROM InventoryBalance ib " +
           "JOIN FETCH ib.product p " +
           "JOIN FETCH ib.warehouse " +
           "WHERE ib.quantity = 0")
    List<InventoryBalance> findOutOfStockItems();

    @Query("SELECT COUNT(DISTINCT ib.product.id) FROM InventoryBalance ib WHERE ib.quantity <= ib.product.reorderLevel AND ib.quantity > 0")
    long countLowStockProducts();

    @Query("SELECT COUNT(DISTINCT ib.product.id) FROM InventoryBalance ib WHERE ib.quantity = 0")
    long countOutOfStockProducts();

    @Query("SELECT SUM(CAST(ib.quantity AS java.math.BigDecimal) * p.unitCost) FROM InventoryBalance ib JOIN ib.product p")
    java.math.BigDecimal calculateTotalInventoryValue();

    @Query("SELECT SUM(ib.quantity) FROM InventoryBalance ib")
    Long calculateTotalUnits();
}
