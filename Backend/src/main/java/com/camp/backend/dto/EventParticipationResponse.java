package com.camp.backend.dto;

import com.camp.backend.entity.EventParticipationStatus;
import java.time.LocalDateTime;

public record EventParticipationResponse(
    Long id,
    Long eventId,
    String eventTitle,
    Long userId,
    String userFullName,
    EventParticipationStatus status,
    LocalDateTime registeredAt
) {
}
