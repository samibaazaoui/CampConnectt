package com.camp.backend.repository;

import com.camp.backend.entity.ChatMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.camp.backend.entity.UserRole;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderBySentAtAsc(Long roomId);
    long countBySenderId(Long senderId);
    Optional<ChatMessage> findTopBySenderIdOrderBySentAtDesc(Long senderId);

    /**
     * Recherche complexe via Keywords impliquant deux tables :
     * Filtrer les messages d'une salle par rôle de l'expéditeur (ex: seulement les Guides).
     */
    List<ChatMessage> findByRoomIdAndSenderRole(Long roomId, UserRole role);
    
    /**
     * Requête JPQL avec 3 jointures : Récupérer les messages avec leur salle
     * et leur expéditeur, filtrés par rôle et date.
     */
    @Query("SELECT m FROM ChatMessage m " +
           "JOIN m.room r " +
           "JOIN m.sender s " +
           "WHERE s.role = :role " +
           "AND m.sentAt >= :since")
    List<ChatMessage> findMessagesBySenderRoleAndDate(
        @Param("role") UserRole role,
        @Param("since") LocalDateTime since);
    
    /**
     * Requête JPQL avec jointures pour trouver les messages dans les salles
     * où un utilisateur spécifique est participant.
     */
    @Query("SELECT m FROM ChatMessage m " +
           "JOIN m.room r " +
           "JOIN r.participants p " +
           "WHERE p.user.id = :userId")
    List<ChatMessage> findMessagesInUserRooms(@Param("userId") Long userId);
}
