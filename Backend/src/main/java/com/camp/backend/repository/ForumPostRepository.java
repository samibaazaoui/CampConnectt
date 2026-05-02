package com.camp.backend.repository;

import com.camp.backend.entity.ForumPost;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {

    Optional<ForumPost> findTopByAuthorIdOrderByCreatedAtDesc(Long authorId);
    
    /**
     * JPQL complexe avec JOIN : Recherche des posts par mot-clé dans le titre 
     * ET dont l'auteur a un score de Karma supérieur à un seuil donné.
     * Cette fonction permet de filtrer les discussions de qualité (experts).
     */
    @Query("SELECT p FROM ForumPost p JOIN p.author u WHERE p.title LIKE %:keyword% AND u.karma >= :minKarma")
    List<ForumPost> searchHighQualityPosts(@Param("keyword") String keyword, @Param("minKarma") Integer minKarma);
    
    /**
     * Requête JPQL avec 3 jointures : Récupérer les posts avec leurs auteurs
     * et leurs commentaires, filtrés par date de création et rôle de l'auteur.
     */
    @Query("SELECT DISTINCT p FROM ForumPost p " +
           "JOIN p.author u " +
           "LEFT JOIN p.comments c " +
           "WHERE u.role = :role " +
           "AND p.createdAt >= :since")
    List<ForumPost> findPostsWithDetailsByRoleAndDate(
        @Param("role") com.camp.backend.entity.UserRole role, 
        @Param("since") LocalDateTime since);
    
    /**
     * Requête JPQL avec jointure pour compter le nombre de posts par auteur
     */
    @Query("SELECT COUNT(p) FROM ForumPost p JOIN p.author u WHERE u.id = :userId")
    long countPostsByUserId(@Param("userId") Long userId);
}
