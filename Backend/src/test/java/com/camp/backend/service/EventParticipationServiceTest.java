package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateEventParticipationRequest;
import com.camp.backend.dto.EventParticipationResponse;
import com.camp.backend.entity.Event;
import com.camp.backend.entity.EventParticipation;
import com.camp.backend.entity.EventParticipationStatus;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EventParticipationRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class EventParticipationServiceTest {

    @Mock
    private EventParticipationRepository participationRepository;
    @Mock
    private EventService eventService;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private EventParticipationService participationService;

    private Event event;
    private User user;
    private EventParticipation participation;

    @BeforeEach
    void setUp() {
        event = new Event();
        event.setId(1L);
        event.setTitle("Adventure Camp");

        user = new User();
        user.setId(5L);
        user.setFullName("Jane Doe");

        participation = new EventParticipation();
        participation.setId(10L);
        participation.setEvent(event);
        participation.setUser(user);
        participation.setStatus(EventParticipationStatus.REGISTERED);
    }

    @Test
    void participate_ShouldSucceedAndNotify() {
        when(eventService.getById(1L)).thenReturn(event);
        when(userService.getById(5L)).thenReturn(user);
        when(participationRepository.save(any(EventParticipation.class))).thenReturn(participation);

        EventParticipationResponse response = participationService.participate(new CreateEventParticipationRequest(1L, 5L));

        assertNotNull(response);
        assertEquals(EventParticipationStatus.REGISTERED, response.status());
        verify(notificationService).createNotification(eq(5L), anyString(), anyString(), any());
    }

    @Test
    void updateStatus_ShouldReturnResponse() {
        when(participationRepository.findById(10L)).thenReturn(Optional.of(participation));
        when(participationRepository.save(any(EventParticipation.class))).thenReturn(participation);

        EventParticipationResponse response = participationService.updateStatus(10L, EventParticipationStatus.ATTENDED);

        assertNotNull(response);
        verify(participationRepository).save(any(EventParticipation.class));
    }

    @Test
    void delete_ShouldCallRepository() {
        when(participationRepository.findById(10L)).thenReturn(Optional.of(participation));

        participationService.delete(10L);

        verify(participationRepository).delete(participation);
    }
}
