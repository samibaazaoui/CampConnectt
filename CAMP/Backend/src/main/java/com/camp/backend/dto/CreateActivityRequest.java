package com.camp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateActivityRequest(
    @NotBlank(message = "Name is required")
    String name,
    
    String description,
    
    @NotNull(message = "Event ID is required")
    Long eventId
) {
}
