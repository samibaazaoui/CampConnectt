package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateFeedbackRequest;
import com.camp.backend.dto.FeedbackResponse;
import com.camp.backend.entity.Campsite;
import com.camp.backend.entity.Feedback;
import com.camp.backend.entity.User;
import com.camp.backend.repository.FeedbackRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserService userService;
    private final CampsiteService campsiteService;

    public FeedbackService(FeedbackRepository feedbackRepository,
                           UserService userService,
                           CampsiteService campsiteService) {
        this.feedbackRepository = feedbackRepository;
        this.userService = userService;
        this.campsiteService = campsiteService;
    }

    public FeedbackResponse create(CreateFeedbackRequest request) {
        User user = userService.getById(request.userId());
        Campsite campsite = campsiteService.getById(request.campsiteId());

        Feedback feedback = new Feedback();
        feedback.setUser(user);
        feedback.setCampsite(campsite);
        feedback.setRating(request.rating());
        feedback.setComment(request.comment());

        Feedback saved = feedbackRepository.save(feedback);
        return toResponse(saved);
    }

    public List<FeedbackResponse> findByCampsite(Long campsiteId) {
        return feedbackRepository.findByCampsiteIdOrderByCreatedAtDesc(campsiteId)
                .stream().map(this::toResponse).toList();
    }

    public List<FeedbackResponse> findAll() {
        return feedbackRepository.findAll().stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found: " + id));
        feedbackRepository.delete(feedback);
    }

    private FeedbackResponse toResponse(Feedback f) {
        return new FeedbackResponse(
            f.getId(),
            f.getUser().getId(),
            f.getUser().getFullName(),
            f.getCampsite().getId(),
            f.getCampsite().getName(),
            f.getRating(),
            f.getComment(),
            f.getCreatedAt()
        );
    }
}
