package com.camp.backend.dto;

import jakarta.validation.constraints.NotNull;

public record CreateChatMessageRequest(
    @NotNull(message = "Room ID is required")
    Long roomId,
    
    @NotNull(message = "Sender ID is required")
    Long senderId,
    
    String content,

    boolean isIncognito,

    String messageType,

    String audioUrl
) {
}
