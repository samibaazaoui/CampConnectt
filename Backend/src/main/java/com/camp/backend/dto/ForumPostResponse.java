package com.camp.backend.dto;

import java.time.LocalDateTime;

public record ForumPostResponse(
    Long id,
    String title,
    String content,
    Long authorId,
    String authorName,
    LocalDateTime createdAt
) {
}
