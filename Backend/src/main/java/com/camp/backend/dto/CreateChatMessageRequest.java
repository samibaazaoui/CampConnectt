package com.camp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateChatMessageRequest(
    @NotNull(message = "Room ID is required")
    Long roomId,
    
    @NotNull(message = "Sender ID is required")
    Long senderId,
    
    @NotBlank(message = "Content is required")
    String content
) {
}
