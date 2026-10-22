package com.stockflow.service;

import com.stockflow.dto.response.AuditEventResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.entity.AuditEvent;
import com.stockflow.entity.User;
import com.stockflow.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    @Async
    @Transactional
    public void log(String eventType, String entityType, String entityId,
                    User user, String details) {
        AuditEvent event = AuditEvent.builder()
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .performedBy(user)
                .details(details)
                .build();
        auditEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditEventResponse> getAuditEvents(String entityType, String eventType, Pageable pageable) {
        return PageResponse.from(
                auditEventRepository.searchAuditEvents(entityType, eventType, pageable)
                        .map(this::toResponse));
    }

    private AuditEventResponse toResponse(AuditEvent ae) {
        return AuditEventResponse.builder()
                .id(ae.getId())
                .eventType(ae.getEventType())
                .entityType(ae.getEntityType())
                .entityId(ae.getEntityId())
                .performedBy(ae.getPerformedBy() != null ? AuditEventResponse.UserRef.builder()
                        .id(ae.getPerformedBy().getId())
                        .username(ae.getPerformedBy().getUsername())
                        .fullName(ae.getPerformedBy().getFullName())
                        .build() : null)
                .ipAddress(ae.getIpAddress())
                .details(ae.getDetails())
                .oldValues(ae.getOldValues())
                .newValues(ae.getNewValues())
                .createdAt(ae.getCreatedAt())
                .build();
    }
}
