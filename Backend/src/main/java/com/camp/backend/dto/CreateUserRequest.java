package com.camp.backend.dto;

import com.camp.backend.entity.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(
    @Email String email,
    @NotBlank String password,
    @NotBlank String fullName,
    UserRole role
) {
}
