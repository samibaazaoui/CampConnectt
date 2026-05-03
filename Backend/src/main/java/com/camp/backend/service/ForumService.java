package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateForumCommentRequest;
import com.camp.backend.dto.CreateForumPostRequest;
import com.camp.backend.dto.ForumCommentResponse;
import com.camp.backend.dto.ForumPostResponse;
import com.camp.backend.entity.ForumComment;
import com.camp.backend.entity.ForumPost;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.entity.User;
import com.camp.backend.repository.ForumCommentRepository;
import com.camp.backend.repository.ForumPostRepository;
import com.camp.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ForumService {

    private final ForumPostRepository postRepository;
    private final ForumCommentRepository commentRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public ForumService(ForumPostRepository postRepository,
                        ForumCommentRepository commentRepository,
                        UserService userService,
                        NotificationService notificationService,
                        UserRepository userRepository) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public ForumPostResponse createPost(CreateForumPostRequest request) {
        User author = userService.getById(request.authorId());
        
        ForumPost post = new ForumPost();
        post.setTitle(request.title());
        post.setContent(request.content());
        post.setAuthor(author);
        
        ForumPost saved = postRepository.save(post);

        // BROADCAST NOTIFICATION TO ALL USERS (EXCEPT AUTHOR)
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            if (!user.getId().equals(author.getId())) {
                notificationService.createNotification(
                    user.getId(),
                    "New Forum Post",
                    author.getFullName() + " posted: \"" + saved.getTitle() + "\"",
                    NotificationType.FORUM
                );
            }
        }

        return toPostResponse(saved);
    }

    public List<ForumPostResponse> findAllPosts() {
        return postRepository.findAll().stream().map(this::toPostResponse).toList();
    }
    
    public ForumPostResponse getPostById(Long id) {
        return toPostResponse(getPostEntityById(id));
    }
    
    public ForumPost getPostEntityById(Long id) {
        return postRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Post not found: " + id));
    }

    public ForumPostResponse updatePost(Long id, CreateForumPostRequest request) {
        ForumPost post = getPostEntityById(id);
        post.setTitle(request.title());
        post.setContent(request.content());
        ForumPost saved = postRepository.save(post);
        return toPostResponse(saved);
    }

    public void deletePost(Long id) {
        ForumPost post = getPostEntityById(id);
        postRepository.delete(post);
    }

    public ForumCommentResponse createComment(CreateForumCommentRequest request) {
        User author = userService.getById(request.authorId());
        ForumPost post = getPostEntityById(request.postId());
        
        ForumComment comment = new ForumComment();
        comment.setContent(request.content());
        comment.setPost(post);
        comment.setAuthor(author);
        
        ForumComment saved = commentRepository.save(comment);
        return toCommentResponse(saved);
    }

    public List<ForumCommentResponse> findCommentsByPostId(Long postId) {
        return commentRepository.findByPostId(postId).stream().map(this::toCommentResponse).toList();
    }

    public void deleteComment(Long id) {
        ForumComment comment = commentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + id));
        commentRepository.delete(comment);
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
    
    private ForumCommentResponse toCommentResponse(ForumComment comment) {
        return new ForumCommentResponse(
            comment.getId(),
            comment.getContent(),
            comment.getPost().getId(),
            comment.getAuthor().getId(),
            comment.getAuthor().getFullName(),
            comment.getCreatedAt()
        );
    }
}
