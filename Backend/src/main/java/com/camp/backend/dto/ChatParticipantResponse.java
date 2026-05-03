package com.camp.backend.dto;

import java.time.LocalDateTime;

public record ChatParticipantResponse(
    Long id,
    Long roomId,
    String roomName,
    Long userId,
    String userFullName,
    LocalDateTime joinedAt
) {
}
