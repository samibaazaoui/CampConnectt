package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateEventRequest;
import com.camp.backend.dto.EventResponse;
import com.camp.backend.entity.Event;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EventRepository;
import com.camp.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class EventServiceTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EventService eventService;

    private User creator;
    private Event event;

    @BeforeEach
    void setUp() {
        creator = new User();
        creator.setId(1L);
        creator.setFullName("Organizer");

        event = new Event();
        event.setId(10L);
        event.setTitle("Survival Course");
        event.setCreatedBy(creator);
    }

    @Test
    void create_ShouldBroadcastNotificationAndReturnResponse() {
        when(userService.getById(1L)).thenReturn(creator);
        when(eventRepository.save(any(Event.class))).thenReturn(event);
        when(userRepository.findAll()).thenReturn(Collections.singletonList(new User()));

        CreateEventRequest request = new CreateEventRequest("Survival Course", "Learn to survive", "forest", LocalDateTime.now(), LocalDateTime.now().plusDays(2), 1L);
        EventResponse response = eventService.create(request);

        assertNotNull(response);
        verify(notificationService, atLeastOnce()).createNotification(any(), anyString(), anyString(), any());
    }

    @Test
    void findById_WhenExists_ShouldReturnResponse() {
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));

        EventResponse response = eventService.findById(10L);

        assertEquals("Survival Course", response.title());
    }

    @Test
    void delete_ShouldCallRepository() {
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));

        eventService.delete(10L);

        verify(eventRepository).delete(event);
    }
}
