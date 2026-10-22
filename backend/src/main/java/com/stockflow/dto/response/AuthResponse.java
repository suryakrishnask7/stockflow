package com.stockflow.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserSummary user;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String role;
    }
}
