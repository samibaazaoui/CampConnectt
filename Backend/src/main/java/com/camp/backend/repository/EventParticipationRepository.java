package com.camp.backend.repository;

import com.camp.backend.entity.EventParticipation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventParticipationRepository extends JpaRepository<EventParticipation, Long> {
    List<EventParticipation> findByEventId(Long eventId);
    List<EventParticipation> findByUserId(Long userId);
    java.util.Optional<EventParticipation> findByEventIdAndUserId(Long eventId, Long userId);
}
