package com.camp.backend.service;

import com.camp.backend.entity.ForumPost;
import com.camp.backend.repository.ForumPostRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RecommendationService {

    private final ForumPostRepository forumPostRepository;

    public RecommendationService(ForumPostRepository forumPostRepository) {
        this.forumPostRepository = forumPostRepository;
    }

    /**
     * Système de recommandation simple basé sur le karma de l'auteur et la fraîcheur du post
     */
    public List<ForumPost> getRecommendedPostsForUser(Long userId) {
        List<ForumPost> allPosts = forumPostRepository.findAll();
        
        return allPosts.stream()
            .filter(post -> !post.getAuthor().getId().equals(userId))
            .sorted(Comparator.comparingInt((ForumPost p) -> p.getAuthor().getKarma()).reversed()
                .thenComparing(ForumPost::getCreatedAt).reversed())
            .limit(5)
            .toList();
    }

    /**
     * Récupérer les articles tendances (pour N8N)
     * Triés par :
     * - Karma de l'auteur (descendant)
     * - Date de création (descendant)
     */
    public List<ForumPost> getTrendingPosts() {
        List<ForumPost> allPosts = forumPostRepository.findAll();
        
        return allPosts.stream()
            .sorted(Comparator.comparingInt((ForumPost p) -> p.getAuthor().getKarma()).reversed()
                .thenComparing(ForumPost::getCreatedAt).reversed())
            .limit(10)
            .toList();
    }
}
