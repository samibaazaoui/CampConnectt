package com.camp.backend.dto;

public record AuthResponse(
    String token,
    UserResponse user
) {
}
