package com.camp.backend.dto;

import com.camp.backend.entity.EquipmentOrderStatus;
import java.time.LocalDateTime;
import java.util.List;

public record EquipmentOrderResponse(
    Long id,
    Long userId,
    String userFullName,
    EquipmentOrderStatus status,
    LocalDateTime createdAt,
    List<EquipmentOrderItemResponse> items
) {
}
