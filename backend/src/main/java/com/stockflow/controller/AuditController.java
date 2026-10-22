package com.stockflow.controller;

import com.stockflow.dto.response.AuditEventResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-events")
@RequiredArgsConstructor
@Tag(name = "Audit Trail", description = "Immutable audit log of all system and inventory changes")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Query immutable audit logs with entity and event type filtering")
    public ResponseEntity<PageResponse<AuditEventResponse>> getAuditEvents(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String eventType,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditService.getAuditEvents(entityType, eventType, pageable));
    }
}
