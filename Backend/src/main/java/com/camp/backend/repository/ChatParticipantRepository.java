package com.camp.backend.repository;

import com.camp.backend.entity.ChatParticipant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {
    List<ChatParticipant> findByRoomId(Long roomId);
    long countByUserId(Long userId);
}
