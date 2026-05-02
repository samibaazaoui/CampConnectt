package com.camp.backend.dto;

import com.camp.backend.entity.NotificationStatus;
import com.camp.backend.entity.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponse(
    Long id,
    Long userId,
    String title,
    String content,
    NotificationType type,
    NotificationStatus status,
    LocalDateTime createdAt
) {
}
