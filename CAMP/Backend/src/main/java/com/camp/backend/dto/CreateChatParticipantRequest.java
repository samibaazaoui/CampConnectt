package com.camp.backend.dto;

import jakarta.validation.constraints.NotNull;

public record CreateChatParticipantRequest(
    @NotNull(message = "Room ID is required")
    Long roomId,
    
    @NotNull(message = "User ID is required")
    Long userId
) {
}
