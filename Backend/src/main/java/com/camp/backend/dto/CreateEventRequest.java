package com.camp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateEventRequest(
    @NotBlank(message = "Title is required")
    String title,
    
    String description,
    
    @NotBlank(message = "Location is required")
    String location,
    
    @NotNull(message = "Start time is required")
    LocalDateTime startAt,
    
    @NotNull(message = "End time is required")
    LocalDateTime endAt,
    
    @NotNull(message = "Creator user ID is required")
    Long createdById
) {
}
