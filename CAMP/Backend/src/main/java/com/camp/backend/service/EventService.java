package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateEventRequest;
import com.camp.backend.dto.EventResponse;
import com.camp.backend.entity.Event;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EventRepository;
import com.camp.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public EventService(EventRepository eventRepository, UserService userService,
                        NotificationService notificationService, UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.userService = userService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public EventResponse create(CreateEventRequest request) {
        User creator = userService.getById(request.createdById());

        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setLocation(request.location());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setCreatedBy(creator);

        Event saved = eventRepository.save(event);

        // BROADCAST NOTIFICATION TO ALL USERS
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            notificationService.createNotification(
                user.getId(),
                "New Event: " + saved.getTitle(),
                "A new event \"" + saved.getTitle() + "\" at " + saved.getLocation() + " has been announced!",
                NotificationType.EVENT
            );
        }

        return toResponse(saved);
    }

    public List<EventResponse> findAll() {
        return eventRepository.findAll().stream().map(this::toResponse).toList();
    }

    public EventResponse findById(Long id) {
        return toResponse(getById(id));
    }

    public Event getById(Long id) {
        return eventRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + id));
    }

    public EventResponse update(Long id, CreateEventRequest request) {
        Event event = getById(id);
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setLocation(request.location());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        Event saved = eventRepository.save(event);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Event event = getById(id);
        eventRepository.delete(event);
    }

    private EventResponse toResponse(Event event) {
        return new EventResponse(
            event.getId(),
            event.getTitle(),
            event.getDescription(),
            event.getLocation(),
            event.getStartAt(),
            event.getEndAt(),
            event.getCreatedBy() != null ? event.getCreatedBy().getId() : null,
            event.getCreatedBy() != null ? event.getCreatedBy().getFullName() : null
        );
    }
}
