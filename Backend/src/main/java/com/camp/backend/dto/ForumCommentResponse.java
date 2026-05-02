package com.camp.backend.dto;

import java.time.LocalDateTime;

public record ForumCommentResponse(
    Long id,
    String content,
    Long postId,
    Long authorId,
    String authorName,
    LocalDateTime createdAt
) {
}
