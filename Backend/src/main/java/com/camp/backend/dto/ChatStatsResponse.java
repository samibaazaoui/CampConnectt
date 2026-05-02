package com.camp.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ChatStatsResponse(
    long totalMessages,
    long totalRoomsJoined,
    LocalDateTime lastMessageAt,
    double avgMessageLength,
    long peakHour, // 0-23
    List<String> badges
) {
}
