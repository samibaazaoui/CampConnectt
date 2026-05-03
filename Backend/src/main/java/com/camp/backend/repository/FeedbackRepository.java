package com.camp.backend.repository;

import com.camp.backend.entity.Feedback;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByCampsiteIdOrderByCreatedAtDesc(Long campsiteId);
    List<Feedback> findByUserIdOrderByCreatedAtDesc(Long userId);
}
