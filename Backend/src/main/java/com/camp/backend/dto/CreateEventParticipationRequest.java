package com.camp.backend.dto;

import jakarta.validation.constraints.NotNull;

public record CreateEventParticipationRequest(
    @NotNull(message = "Event ID is required")
    Long eventId,
    
    @NotNull(message = "User ID is required")
    Long userId
) {
}
