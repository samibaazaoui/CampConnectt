package com.camp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateForumCommentRequest(
    @NotBlank(message = "Content is required")
    String content,
    
    @NotNull(message = "Post ID is required")
    Long postId,
    
    @NotNull(message = "Author ID is required")
    Long authorId
) {
}
