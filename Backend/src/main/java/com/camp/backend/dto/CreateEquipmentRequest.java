package com.camp.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEquipmentRequest(
    @NotBlank String name,
    String description,
    @NotNull @Min(0) Integer quantityInStock,
    @NotNull @Min(0) Double unitPrice,
    String imageUrl
) {
}
