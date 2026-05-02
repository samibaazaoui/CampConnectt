package com.camp.backend.dto;

public record EquipmentOrderItemResponse(
    Long id,
    Long equipmentId,
    String equipmentName,
    Integer quantity,
    Double unitPrice
) {
}
