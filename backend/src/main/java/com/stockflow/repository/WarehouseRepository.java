package com.stockflow.repository;

import com.stockflow.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);
    Optional<Warehouse> findByCode(String code);
    List<Warehouse> findByStatusOrderByName(Warehouse.Status status);

    @Query("SELECT w FROM Warehouse w WHERE w.status = 'ACTIVE' ORDER BY w.name")
    List<Warehouse> findAllActive();

    @Query("SELECT COUNT(ib) > 0 FROM InventoryBalance ib WHERE ib.warehouse.id = :warehouseId AND ib.quantity > 0")
    boolean hasInventory(Long warehouseId);
}
