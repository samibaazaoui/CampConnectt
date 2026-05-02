package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.ActivityResponse;
import com.camp.backend.dto.CreateActivityRequest;
import com.camp.backend.entity.Activity;
import com.camp.backend.entity.Event;
import com.camp.backend.repository.ActivityRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final EventService eventService;

    public ActivityService(ActivityRepository activityRepository, EventService eventService) {
        this.activityRepository = activityRepository;
        this.eventService = eventService;
    }

    public ActivityResponse create(CreateActivityRequest request) {
        Event event = eventService.getById(request.eventId());

        Activity activity = new Activity();
        activity.setName(request.name());
        activity.setDescription(request.description());
        activity.setEvent(event);

        Activity saved = activityRepository.save(activity);
        return toResponse(saved);
    }

    public List<ActivityResponse> findAll() {
        return activityRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<ActivityResponse> findByEventId(Long eventId) {
        return activityRepository.findByEventId(eventId).stream().map(this::toResponse).toList();
    }

    public ActivityResponse findById(Long id) {
        return toResponse(getById(id));
    }

    public Activity getById(Long id) {
        return activityRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Activity not found: " + id));
    }

    public ActivityResponse update(Long id, CreateActivityRequest request) {
        Activity activity = getById(id);
        activity.setName(request.name());
        activity.setDescription(request.description());
        if (request.eventId() != null) {
            activity.setEvent(eventService.getById(request.eventId()));
        }
        Activity saved = activityRepository.save(activity);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Activity activity = getById(id);
        activityRepository.delete(activity);
    }

    private ActivityResponse toResponse(Activity activity) {
        return new ActivityResponse(
            activity.getId(),
            activity.getName(),
            activity.getDescription(),
            activity.getEvent() != null ? activity.getEvent().getId() : null,
            activity.getEvent() != null ? activity.getEvent().getTitle() : null
        );
    }
}
