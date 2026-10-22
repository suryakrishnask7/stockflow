package com.stockflow.controller;

import com.stockflow.dto.response.AuthResponse;
import com.stockflow.entity.User;
import com.stockflow.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and team management")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<AuthResponse.UserSummary> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        AuthResponse.UserSummary summary = AuthResponse.UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().getName() : "STAFF")
                .build();
        return ResponseEntity.ok(summary);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all team users (Admin only)")
    public ResponseEntity<List<AuthResponse.UserSummary>> listUsers() {
        List<AuthResponse.UserSummary> users = userRepository.findAll().stream()
                .map(u -> AuthResponse.UserSummary.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .fullName(u.getFullName())
                        .role(u.getRole() != null ? u.getRole().getName() : "STAFF")
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }
}
