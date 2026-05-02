package com.camp.backend.dto;

import java.time.LocalDateTime;

public record ChatRoomResponse(
    Long id,
    String name,
    String roomType,
    LocalDateTime createdAt
) {
}
