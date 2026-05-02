package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateFeedbackRequest;
import com.camp.backend.dto.FeedbackResponse;
import com.camp.backend.entity.Campsite;
import com.camp.backend.entity.Feedback;
import com.camp.backend.entity.User;
import com.camp.backend.repository.FeedbackRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private UserService userService;
    @Mock
    private CampsiteService campsiteService;

    @InjectMocks
    private FeedbackService feedbackService;

    private User user;
    private Campsite campsite;
    private Feedback feedback;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setFullName("Reviewer");

        campsite = new Campsite();
        campsite.setId(5L);
        campsite.setName("Mountain Lake");

        feedback = new Feedback();
        feedback.setId(10L);
        feedback.setUser(user);
        feedback.setCampsite(campsite);
        feedback.setRating(5);
        feedback.setComment("Great place");
    }

    @Test
    void create_ShouldReturnFeedbackResponse() {
        when(userService.getById(1L)).thenReturn(user);
        when(campsiteService.getById(5L)).thenReturn(campsite);
        when(feedbackRepository.save(any(Feedback.class))).thenReturn(feedback);

        FeedbackResponse response = feedbackService.create(new CreateFeedbackRequest(1L, 5L, 5, "Great place"));

        assertNotNull(response);
        assertEquals(5, response.rating());
        assertEquals("Mountain Lake", response.campsiteName());
    }

    @Test
    void delete_ShouldCallRepository() {
        when(feedbackRepository.findById(10L)).thenReturn(Optional.of(feedback));

        feedbackService.delete(10L);

        verify(feedbackRepository).delete(feedback);
    }
}
