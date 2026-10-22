package com.stockflow.repository;

import com.stockflow.entity.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

    @Query("SELECT ae FROM AuditEvent ae " +
           "LEFT JOIN FETCH ae.performedBy " +
           "WHERE (:entityType IS NULL OR ae.entityType = :entityType) AND " +
           "(:eventType IS NULL OR ae.eventType = :eventType) " +
           "ORDER BY ae.createdAt DESC")
    Page<AuditEvent> searchAuditEvents(String entityType, String eventType, Pageable pageable);

    @Query("SELECT ae FROM AuditEvent ae LEFT JOIN FETCH ae.performedBy WHERE ae.entityType = :entityType AND ae.entityId = :entityId ORDER BY ae.createdAt DESC")
    Page<AuditEvent> findByEntityTypeAndEntityId(String entityType, String entityId, Pageable pageable);
}
