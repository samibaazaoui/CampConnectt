// src/main/java/com/camp/backend/controller/ForumController.java
package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateForumCommentRequest;
import com.camp.backend.dto.CreateForumPostRequest;
import com.camp.backend.dto.ForumCommentResponse;
import com.camp.backend.dto.ForumPostResponse;
import com.camp.backend.service.ForumService;
import com.camp.backend.repository.ForumPostRepository;
import com.camp.backend.repository.ForumCommentRepository;
import com.camp.backend.entity.UserRole;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum")
public class ForumController {

    private final ForumService forumService;
    private final ForumPostRepository postRepository;
    private final ForumCommentRepository commentRepository;

    public ForumController(ForumService forumService,
                          ForumPostRepository postRepository,
                          ForumCommentRepository commentRepository) {
        this.forumService = forumService;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }

    // ==================== POSTS ====================

    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<ForumPostResponse>> createPost(@Valid @RequestBody CreateForumPostRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Forum post created", forumService.createPost(request)));
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> findAllPosts() {
        return ResponseEntity.ok(ApiResponse.ok("Forum posts fetched", forumService.findAllPosts()));
    }

    @GetMapping("/posts/search-hq")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> searchHighQuality(
            @RequestParam String keyword, 
            @RequestParam(defaultValue = "20") Integer minKarma) {
        return ResponseEntity.ok(ApiResponse.ok("High quality posts fetched", 
            forumService.searchHighQuality(keyword, minKarma)));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<ForumPostResponse>> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Forum post fetched", forumService.getPostById(id)));
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<ForumPostResponse>> updatePost(@PathVariable Long id, @Valid @RequestBody CreateForumPostRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Forum post updated", forumService.updatePost(id, request)));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id) {
        forumService.deletePost(id);
        return ResponseEntity.ok(ApiResponse.ok("Forum post deleted", null));
    }

    // ✅ NOUVEAU : Posts by Role + Date (consomme findPostsWithDetailsByRoleAndDate)
    @GetMapping("/posts/by-role")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> getPostsByRoleAndDate(
            @RequestParam UserRole role,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        
        List<ForumPostResponse> posts = postRepository.findPostsWithDetailsByRoleAndDate(role, since).stream()
            .map(this::toPostResponse)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.ok("Posts by role fetched", posts));
    }

    // ==================== COMMENTAIRES ====================

    @PostMapping("/comments")
    public ResponseEntity<ApiResponse<ForumCommentResponse>> createComment(@Valid @RequestBody CreateForumCommentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Comment added", forumService.createComment(request)));
    }

    @GetMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<List<ForumCommentResponse>>> findCommentsByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(ApiResponse.ok("Comments fetched", forumService.findCommentsByPostId(postId)));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        forumService.deleteComment(id);
        return ResponseEntity.ok(ApiResponse.ok("Comment deleted", null));
    }

    // ✅ NOUVEAU : Expert Comments (consomme findCommentsByAuthorKarmaAndDate)
    @GetMapping("/comments/experts")
    public ResponseEntity<ApiResponse<List<ForumCommentResponse>>> getExpertComments(
            @RequestParam Integer minKarma,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        
        List<ForumCommentResponse> comments = commentRepository.findCommentsByAuthorKarmaAndDate(minKarma, since).stream()
            .map(this::toCommentResponse)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(ApiResponse.ok("Expert comments fetched", comments));
    }

    // ==================== STATS UTILISATEUR ====================

    // ✅ NOUVEAU : User Forum Stats (consomme COUNT JPQL)
    @GetMapping("/stats/user/{userId}")
    public ResponseEntity<ApiResponse<UserForumStats>> getUserForumStats(@PathVariable Long userId) {
        long postCount = postRepository.countPostsByUserId(userId);
        long commentCount = commentRepository.countCommentsByUserId(userId);
        
        UserForumStats stats = new UserForumStats(userId, postCount, commentCount, postCount + commentCount);
        return ResponseEntity.ok(ApiResponse.ok("User forum stats fetched", stats));
    }

    // ==================== MAINTENANCE ====================

    @PostMapping("/maintenance/trigger")
    public ResponseEntity<ApiResponse<String>> triggerMaintenance() {
        forumService.performMaintenance();
        return ResponseEntity.ok(ApiResponse.ok("Forum maintenance executed", "Maintenance completed successfully"));
    }

    // ==================== MAPPERS ====================

    private ForumPostResponse toPostResponse(com.camp.backend.entity.ForumPost post) {
        return new ForumPostResponse(
            post.getId(),
            post.getTitle(),
            post.getContent(),
            post.getAuthor().getId(),
            post.getAuthor().getFullName(),
            post.getCreatedAt()
        );
    }

    private ForumCommentResponse toCommentResponse(com.camp.backend.entity.ForumComment comment) {
        return new ForumCommentResponse(
            comment.getId(),
            comment.getContent(),
            comment.getPost().getId(),
            comment.getAuthor().getId(),
            comment.getAuthor().getFullName(),
            comment.getCreatedAt()
        );
    }

    // ✅ DTO pour les stats utilisateur
    public record UserForumStats(Long userId, long postCount, long commentCount, long totalInteractions) {}
}