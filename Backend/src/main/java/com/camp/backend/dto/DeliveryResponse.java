package com.camp.backend.dto;

import com.camp.backend.entity.DeliveryStatus;
import java.time.LocalDateTime;

public record DeliveryResponse(
    Long id,
    Long orderId,
    String deliveryAddress,
    String deliveryAgent,
    DeliveryStatus status,
    LocalDateTime scheduledAt,
    LocalDateTime deliveredAt
) {
}
