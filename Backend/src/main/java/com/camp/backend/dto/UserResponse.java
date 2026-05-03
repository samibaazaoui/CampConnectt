package com.camp.backend.dto;

import com.camp.backend.entity.UserRole;
import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String email,
    String fullName,
    UserRole role,
    LocalDateTime createdAt
) {
}
