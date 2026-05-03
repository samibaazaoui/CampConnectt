package com.camp.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record QrEventInfoResponse(
    String participantName,
    String participantEmail,
    String eventTitle,
    String eventDescription,
    String eventLocation,
    LocalDateTime eventStartAt,
    LocalDateTime eventEndAt,
    String participationStatus,
    LocalDateTime registeredAt,
    List<ActivityInfo> activities
) {
    public record ActivityInfo(
        Long id,
        String name,
        String description
    ) {}
}
