package com.camp.backend.dto;

import com.camp.backend.entity.ApprovalStatus;

public record EquipmentResponse(
    Long id,
    String name,
    String description,
    Integer quantityInStock,
    Double unitPrice,
    String imageUrl,
    Long ownerId,
    String ownerName,
    ApprovalStatus approvalStatus
) {
}
