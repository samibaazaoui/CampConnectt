package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.ActivityResponse;
import com.camp.backend.dto.CreateActivityRequest;
import com.camp.backend.entity.Activity;
import com.camp.backend.entity.Event;
import com.camp.backend.repository.ActivityRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private EventService eventService;

    @InjectMocks
    private ActivityService activityService;

    private Event event;
    private Activity activity;
    private CreateActivityRequest createRequest;

    @BeforeEach
    void setUp() {
        event = new Event();
        event.setId(1L);
        event.setTitle("Main Event");

        activity = new Activity();
        activity.setId(10L);
        activity.setName("Hiking");
        activity.setDescription("A nice hike");
        activity.setEvent(event);

        createRequest = new CreateActivityRequest("Hiking", "A nice hike", 1L);
    }

    @Test
    void create_ShouldReturnActivityResponse() {
        when(eventService.getById(1L)).thenReturn(event);
        when(activityRepository.save(any(Activity.class))).thenReturn(activity);

        ActivityResponse response = activityService.create(createRequest);

        assertNotNull(response);
        assertEquals(activity.getName(), response.name());
        assertEquals(event.getId(), response.eventId());
        verify(activityRepository, times(1)).save(any(Activity.class));
    }

    @Test
    void getById_WhenExists_ShouldReturnActivity() {
        when(activityRepository.findById(10L)).thenReturn(Optional.of(activity));

        Activity result = activityService.getById(10L);

        assertEquals(10L, result.getId());
        assertEquals("Hiking", result.getName());
    }

    @Test
    void getById_WhenNotExists_ShouldThrowException() {
        when(activityRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> activityService.getById(99L));
    }

    @Test
    void update_ShouldUpdateAndReturnResponse() {
        when(activityRepository.findById(10L)).thenReturn(Optional.of(activity));
        when(activityRepository.save(any(Activity.class))).thenReturn(activity);

        ActivityResponse response = activityService.update(10L, createRequest);

        assertNotNull(response);
        verify(activityRepository).save(any(Activity.class));
    }

    @Test
    void delete_ShouldCallRepositoryDelete() {
        when(activityRepository.findById(10L)).thenReturn(Optional.of(activity));

        activityService.delete(10L);

        verify(activityRepository).delete(activity);
    }
}
