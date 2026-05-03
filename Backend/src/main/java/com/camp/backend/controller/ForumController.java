package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateForumCommentRequest;
import com.camp.backend.dto.CreateForumPostRequest;
import com.camp.backend.dto.ForumCommentResponse;
import com.camp.backend.dto.ForumPostResponse;
import com.camp.backend.service.ForumService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/forum")
public class ForumController {

    private final ForumService forumService;

    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<ForumPostResponse>> createPost(@Valid @RequestBody CreateForumPostRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Forum post created", forumService.createPost(request)));
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<List<ForumPostResponse>>> findAllPosts() {
        return ResponseEntity.ok(ApiResponse.ok("Forum posts fetched", forumService.findAllPosts()));
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
}
