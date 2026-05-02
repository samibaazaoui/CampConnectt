package com.camp.backend.repository;

import com.camp.backend.entity.ScoreHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScoreHistoryRepository extends JpaRepository<ScoreHistory, Long> {
    
    List<ScoreHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT sh FROM ScoreHistory sh JOIN sh.user u ORDER BY u.karma DESC")
    List<ScoreHistory> findLeaderboard();
}
