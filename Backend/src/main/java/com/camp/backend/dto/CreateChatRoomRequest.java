package com.camp.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateChatRoomRequest(
    @NotBlank(message = "Room name is required")
    String name
) {
}
