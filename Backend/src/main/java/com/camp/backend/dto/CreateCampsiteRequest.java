package com.camp.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCampsiteRequest(
    @NotBlank String name,
    @NotBlank String location,
    @NotNull @Min(1) Integer capacity,
    @NotNull @Min(0) Double nightlyPrice,
    String imageUrl
) {
}
