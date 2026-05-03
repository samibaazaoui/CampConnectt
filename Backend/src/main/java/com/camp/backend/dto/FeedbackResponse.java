package com.camp.backend.dto;

import java.time.LocalDateTime;

public record FeedbackResponse(
    Long id,
    Long userId,
    String userName,
    Long campsiteId,
    String campsiteName,
    Integer rating,
    String comment,
    LocalDateTime createdAt
) {}
