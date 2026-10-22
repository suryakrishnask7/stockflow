package com.stockflow.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditEventResponse {
    private Long id;
    private String eventType;
    private String entityType;
    private String entityId;
    private UserRef performedBy;
    private String ipAddress;
    private String details;
    private String oldValues;
    private String newValues;
    private Instant createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserRef {
        private Long id;
        private String username;
        private String fullName;
    }
}
