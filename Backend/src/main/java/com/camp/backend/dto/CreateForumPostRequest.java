package com.camp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateForumPostRequest(
    @NotBlank(message = "Title is required")
    String title,
    
    @NotBlank(message = "Content is required")
    String content,
    
    @NotNull(message = "Author ID is required")
    Long authorId
) {
}
