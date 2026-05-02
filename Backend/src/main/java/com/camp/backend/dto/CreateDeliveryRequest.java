package com.camp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateDeliveryRequest(
    @NotNull(message = "Order ID is required")
    Long orderId,
    
    @NotBlank(message = "Delivery address is required")
    String deliveryAddress,
    
    String deliveryAgent,
    
    LocalDateTime scheduledAt
) {
}
