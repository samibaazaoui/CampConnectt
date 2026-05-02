package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.ForumPostResponse;
import com.camp.backend.entity.ForumPost;
import com.camp.backend.service.RecommendationService;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/user/{userId}/posts")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> getRecommendedPosts(@PathVariable Long userId) {
        List<ForumPost> recommendedPosts = recommendationService.getRecommendedPostsForUser(userId);
        List<ForumPostResponse> responses = recommendedPosts.stream()
            .map(this::toPostResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Recommended posts fetched", responses));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> getTrendingPosts() {
        List<ForumPost> trendingPosts = recommendationService.getTrendingPosts();
        List<ForumPostResponse> responses = trendingPosts.stream()
            .map(this::toPostResponse)
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Trending posts fetched", responses));
    }

    private ForumPostResponse toPostResponse(ForumPost post) {
        return new ForumPostResponse(
            post.getId(),
            post.getTitle(),
            post.getContent(),
            post.getAuthor().getId(),
            post.getAuthor().getFullName(),
            post.getCreatedAt()
        );
    }
}
