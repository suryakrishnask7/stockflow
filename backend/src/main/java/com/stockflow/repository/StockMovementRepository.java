package com.stockflow.repository;

import com.stockflow.entity.StockMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    Optional<StockMovement> findByIdempotencyKey(String idempotencyKey);
    Optional<StockMovement> findByReferenceNumber(String referenceNumber);

    @Query("SELECT sm FROM StockMovement sm " +
           "JOIN FETCH sm.product p " +
           "JOIN FETCH p.category " +
           "LEFT JOIN FETCH sm.sourceWarehouse " +
           "LEFT JOIN FETCH sm.destWarehouse " +
           "JOIN FETCH sm.performedBy " +
           "WHERE " +
           "(:productId IS NULL OR p.id = :productId) AND " +
           "(:warehouseId IS NULL OR sm.sourceWarehouse.id = :warehouseId OR sm.destWarehouse.id = :warehouseId) AND " +
           "(:movementType IS NULL OR sm.movementType = :movementType) AND " +
           "(:fromDate IS NULL OR sm.createdAt >= :fromDate) AND " +
           "(:toDate IS NULL OR sm.createdAt <= :toDate)")
    Page<StockMovement> searchMovements(
            @Param("productId") Long productId,
            @Param("warehouseId") Long warehouseId,
            @Param("movementType") StockMovement.MovementType movementType,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm " +
           "JOIN FETCH sm.product " +
           "LEFT JOIN FETCH sm.sourceWarehouse " +
           "LEFT JOIN FETCH sm.destWarehouse " +
           "WHERE sm.product.id = :productId " +
           "ORDER BY sm.createdAt DESC")
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(@Param("productId") Long productId, Pageable pageable);

    @Query("SELECT sm FROM StockMovement sm " +
           "JOIN FETCH sm.product " +
           "LEFT JOIN FETCH sm.sourceWarehouse " +
           "LEFT JOIN FETCH sm.destWarehouse " +
           "JOIN FETCH sm.performedBy " +
           "ORDER BY sm.createdAt DESC")
    List<StockMovement> findRecentMovements(Pageable pageable);
}
