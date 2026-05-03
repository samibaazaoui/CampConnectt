package com.camp.backend.dto;

import java.time.LocalDateTime;

public record EventResponse(
    Long id,
    String title,
    String description,
    String location,
    LocalDateTime startAt,
    LocalDateTime endAt,
    Long createdById,
    String createdByName
) {
}
