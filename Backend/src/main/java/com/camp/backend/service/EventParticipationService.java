package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateEventParticipationRequest;
import com.camp.backend.dto.EventParticipationResponse;
import com.camp.backend.entity.Event;
import com.camp.backend.entity.EventParticipation;
import com.camp.backend.entity.EventParticipationStatus;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EventParticipationRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EventParticipationService {

    private final EventParticipationRepository participationRepository;
    private final EventService eventService;
    private final UserService userService;
    private final NotificationService notificationService;

    public EventParticipationService(EventParticipationRepository participationRepository,
                                     EventService eventService,
                                     UserService userService,
                                     NotificationService notificationService) {
        this.participationRepository = participationRepository;
        this.eventService = eventService;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    public EventParticipationResponse participate(CreateEventParticipationRequest request) {
        if (participationRepository.findByEventIdAndUserId(request.eventId(), request.userId()).isPresent()) {
            throw new RuntimeException("Already joined this event");
        }
        
        Event event = eventService.getById(request.eventId());
        User user = userService.getById(request.userId());

        EventParticipation participation = new EventParticipation();
        participation.setEvent(event);
        participation.setUser(user);
        participation.setStatus(EventParticipationStatus.REGISTERED);
        participation.setRegisteredAt(LocalDateTime.now());
        
        EventParticipation saved = participationRepository.save(participation);

        // CREATE NOTIFICATION
        notificationService.createNotification(
                user.getId(),
                "New Participation Registered",
                "You have successfully registered for the event: " + event.getTitle(),
                NotificationType.EVENT
        );

        return toResponse(saved);
    }

    public boolean isUserJoined(Long eventId, Long userId) {
        return participationRepository.findByEventIdAndUserId(eventId, userId).isPresent();
    }
    
    public EventParticipationResponse updateStatus(Long id, EventParticipationStatus status) {
        EventParticipation participation = participationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Participation not found: " + id));
            
        participation.setStatus(status);
        EventParticipation saved = participationRepository.save(participation);
        return toResponse(saved);
    }

    public List<EventParticipationResponse> findAll() {
        return participationRepository.findAll().stream().map(this::toResponse).toList();
    }

    public EventParticipationResponse findById(Long id) {
        EventParticipation participation = participationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Participation not found: " + id));
        return toResponse(participation);
    }
    
    public List<EventParticipationResponse> findByEventId(Long eventId) {
        return participationRepository.findByEventId(eventId).stream().map(this::toResponse).toList();
    }
    
    public List<EventParticipationResponse> findByUserId(Long userId) {
        return participationRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public void delete(Long id) {
        EventParticipation participation = participationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Participation not found: " + id));
        participationRepository.delete(participation);
    }

    private EventParticipationResponse toResponse(EventParticipation participation) {
        return new EventParticipationResponse(
            participation.getId(),
            participation.getEvent().getId(),
            participation.getEvent().getTitle(),
            participation.getUser().getId(),
            participation.getUser().getFullName(),
            participation.getStatus(),
            participation.getRegisteredAt()
        );
    }
}
