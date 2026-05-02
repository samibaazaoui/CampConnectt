package com.camp.backend.dto;

import java.time.LocalDateTime;

public record WebSocketChatMessage(
    Long id,
    Long roomId,
    Long senderId,
    String senderName,
    String content,
    boolean isIncognito,
    LocalDateTime sentAt,
    String type,
    String messageType,
    String audioUrl
) {}
