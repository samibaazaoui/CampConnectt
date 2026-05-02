package com.camp.backend.dto;

public record ActivityResponse(
    Long id,
    String name,
    String description,
    Long eventId,
    String eventTitle
) {
}
