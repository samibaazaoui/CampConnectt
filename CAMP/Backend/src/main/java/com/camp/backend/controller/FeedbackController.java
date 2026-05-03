package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateFeedbackRequest;
import com.camp.backend.dto.FeedbackResponse;
import com.camp.backend.service.FeedbackService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedbacks")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FeedbackResponse>> create(@Valid @RequestBody CreateFeedbackRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Feedback submitted", feedbackService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("All feedbacks fetched", feedbackService.findAll()));
    }

    @GetMapping("/campsite/{campsiteId}")
    public ResponseEntity<ApiResponse<List<FeedbackResponse>>> findByCampsite(@PathVariable Long campsiteId) {
        return ResponseEntity.ok(ApiResponse.ok("Feedbacks fetched", feedbackService.findByCampsite(campsiteId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        feedbackService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Feedback deleted", null));
    }
}
