package com.camp.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateEquipmentOrderItemRequest(
    @NotNull Long equipmentId,
    @NotNull @Min(1) Integer quantity
) {
}
