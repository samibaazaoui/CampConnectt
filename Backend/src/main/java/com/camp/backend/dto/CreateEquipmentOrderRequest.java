package com.camp.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateEquipmentOrderRequest(
    @NotNull(message = "User ID is required")
    Long userId,
    
    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    List<CreateEquipmentOrderItemRequest> items
) {
}
