package com.camp.backend.dto;

import java.time.LocalDateTime;

public record ChatMessageResponse(
    Long id,
    Long roomId,
    Long senderId,
    String senderName,
    String content,
    LocalDateTime sentAt
) {
}
