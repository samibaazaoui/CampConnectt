package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.config.BadRequestException;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ForumService {

    private static final Logger LOG = LoggerFactory.getLogger(ForumService.class);

    private static final int COOLDOWN_SECONDS = 30;

    private final ForumPostRepository postRepository;
    private final ForumCommentRepository commentRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final SpamCheckService spamCheckService;
    private final UserScoreService userScoreService;

    public ForumService(ForumPostRepository postRepository,
                        ForumCommentRepository commentRepository,
                        UserService userService,
                        NotificationService notificationService,
                        UserRepository userRepository,
                        SpamCheckService spamCheckService,
                        UserScoreService userScoreService) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.spamCheckService = spamCheckService;
        this.userScoreService = userScoreService;
    }

    /**
     * Scheduler: Exécuté tous les jours à minuit.
     * Logique Business : Réduit le Karma des utilisateurs inactifs (pas de post depuis 30 jours)
     * et archive les vieux posts sans activité.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void performMaintenance() {
        LOG.info("[Scheduler] Starting Forum Maintenance...");
        
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        // 1. Sanctionner l'inactivité (-2 Karma pour les inactifs)
        List<User> inactiveUsers = userRepository.findAll().stream()
            .filter(u -> u.getKarma() > 0 && u.getCreatedAt().isBefore(thirtyDaysAgo))
            .toList();
            
        for (User user : inactiveUsers) {
            // On vérifie si l'utilisateur a posté récemment
            long postCount = postRepository.findAll().stream()
                .filter(p -> p.getAuthor().getId().equals(user.getId()) && p.getCreatedAt().isAfter(thirtyDaysAgo))
                .count();
                
            if (postCount == 0) {
                user.setKarma(Math.max(0, user.getKarma() - 2));
                userRepository.save(user);
                LOG.info("[Scheduler] User {} penalized for inactivity (-2 karma).", user.getFullName());
            }
        }
        
        LOG.info("[Scheduler] Forum Maintenance Completed.");
    }

    private void checkSpam(String content) {
        spamCheckService.checkSpam(content);
    }

    /**
     * Anti-spam cooldown: Vérifie que l'utilisateur n'a pas posté dans les 30 dernières secondes.
     */
    private void enforcePostCooldown(Long authorId) {
        Optional<ForumPost> lastPost = postRepository.findTopByAuthorIdOrderByCreatedAtDesc(authorId);
        if (lastPost.isPresent() && lastPost.get().getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS))) {
            throw new BadRequestException("Please wait 30 seconds between posts.");
        }
    }

    private void enforceCommentCooldown(Long authorId) {
        Optional<ForumComment> lastComment = commentRepository.findTopByAuthorIdOrderByCreatedAtDesc(authorId);
        if (lastComment.isPresent() && lastComment.get().getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS))) {
            throw new BadRequestException("Please wait 30 seconds between comments.");
        }
    }

    public ForumPostResponse createPost(CreateForumPostRequest request) {
        // Anti-spam: Cooldown 30 seconds
        enforcePostCooldown(request.authorId());
        
        // ML + Bad Words spam check
        checkSpam(request.title() + " " + request.content());
        
        User author = userService.getById(request.authorId());
        
        ForumPost post = new ForumPost();
        post.setTitle(request.title());
        post.setContent(request.content());
        post.setAuthor(author);
        
        ForumPost saved = postRepository.save(post);

        userScoreService.updateUserScore(author.getId(), 10, "Forum post created");

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

    public List<ForumPostResponse> searchHighQuality(String keyword, Integer minKarma) {
        LOG.info("Searching high quality posts - Keyword: {}, MinKarma: {}", keyword, minKarma);
        List<ForumPostResponse> results = postRepository.searchHighQualityPosts(keyword, minKarma).stream()
                .map(this::toPostResponse).toList();
        LOG.info("Found {} high quality posts", results.size());
        return results;
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
        checkSpam(request.title() + " " + request.content());
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
        // Anti-spam: Cooldown 30 seconds
        enforceCommentCooldown(request.authorId());
        
        // ML + Bad Words spam check
        checkSpam(request.content());
        
        User author = userService.getById(request.authorId());
        ForumPost post = getPostEntityById(request.postId());
        
        ForumComment comment = new ForumComment();
        comment.setContent(request.content());
        comment.setPost(post);
        comment.setAuthor(author);
        
        ForumComment saved = commentRepository.save(comment);

        userScoreService.updateUserScore(author.getId(), 5, "Forum comment created");

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
