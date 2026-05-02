package com.camp.backend.repository;

import com.camp.backend.entity.ForumComment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {
    List<ForumComment> findByPostId(Long postId);

    Optional<ForumComment> findTopByAuthorIdOrderByCreatedAtDesc(Long authorId);
    
    /**
     * Requête JPQL avec 3 jointures : Récupérer les commentaires avec leur post
     * et leur auteur, filtrés par karma de l'auteur et date.
     */
    @Query("SELECT c FROM ForumComment c " +
           "JOIN c.post p " +
           "JOIN c.author u " +
           "WHERE u.karma >= :minKarma " +
           "AND c.createdAt >= :since")
    List<ForumComment> findCommentsByAuthorKarmaAndDate(
        @Param("minKarma") Integer minKarma,
        @Param("since") LocalDateTime since);
    
    /**
     * Compter le nombre de commentaires par utilisateur
     */
    @Query("SELECT COUNT(c) FROM ForumComment c JOIN c.author u WHERE u.id = :userId")
    long countCommentsByUserId(@Param("userId") Long userId);
}
