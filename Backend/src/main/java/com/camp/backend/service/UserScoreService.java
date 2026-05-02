package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.entity.ScoreHistory;
import com.camp.backend.entity.User;
import com.camp.backend.repository.ScoreHistoryRepository;
import com.camp.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserScoreService {

    private final UserRepository userRepository;
    private final ScoreHistoryRepository scoreHistoryRepository;

    public UserScoreService(UserRepository userRepository, ScoreHistoryRepository scoreHistoryRepository) {
        this.userRepository = userRepository;
        this.scoreHistoryRepository = scoreHistoryRepository;
    }

    @Transactional
    public void updateUserScore(Long userId, int changeAmount, String reason) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        int oldScore = user.getKarma();
        int newScore = Math.max(0, oldScore + changeAmount);

        ScoreHistory history = new ScoreHistory();
        history.setUser(user);
        history.setOldScore(oldScore);
        history.setNewScore(newScore);
        history.setChangeAmount(changeAmount);
        history.setReason(reason);

        user.setKarma(newScore);
        userRepository.save(user);
        scoreHistoryRepository.save(history);
    }

    public List<ScoreHistory> getUserScoreHistory(Long userId) {
        return scoreHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<User> getLeaderboard() {
        return userRepository.findAll().stream()
            .sorted((u1, u2) -> Integer.compare(u2.getKarma(), u1.getKarma()))
            .toList();
    }
}
