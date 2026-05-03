package com.camp.backend.dto;

import com.camp.backend.entity.ApprovalStatus;

public record CampsiteResponse(
    Long id,
    String name,
    String location,
    Integer capacity,
    Double nightlyPrice,
    String imageUrl,
    Long ownerId,
    String ownerName,
    ApprovalStatus approvalStatus
) {
}
