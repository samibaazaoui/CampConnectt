package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.entity.ScoreHistory;
import com.camp.backend.entity.User;
import com.camp.backend.service.UserScoreService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/scores")
public class UserScoreController {

    private final UserScoreService userScoreService;

    public UserScoreController(UserScoreService userScoreService) {
        this.userScoreService = userScoreService;
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<User>>> getLeaderboard() {
        return ResponseEntity.ok(ApiResponse.ok("Leaderboard fetched", userScoreService.getLeaderboard()));
    }

    @GetMapping("/user/{userId}/history")
    public ResponseEntity<ApiResponse<List<ScoreHistory>>> getUserScoreHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Score history fetched", userScoreService.getUserScoreHistory(userId)));
    }
}
