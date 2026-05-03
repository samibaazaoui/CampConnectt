package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateEventParticipationRequest;
import com.camp.backend.dto.EventParticipationResponse;
import com.camp.backend.dto.QrEventInfoResponse;
import com.camp.backend.entity.Event;
import com.camp.backend.entity.EventParticipation;
import com.camp.backend.entity.EventParticipationStatus;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.entity.User;
import com.camp.backend.repository.ActivityRepository;
import com.camp.backend.repository.EventParticipationRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class EventParticipationService {

    private final EventParticipationRepository participationRepository;
    private final ActivityRepository activityRepository;
    private final EventService eventService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final QrCodeService qrCodeService;
    private final EmailService emailService;
    private final NetworkService networkService;

    public EventParticipationService(EventParticipationRepository participationRepository,
                                     ActivityRepository activityRepository,
                                     EventService eventService,
                                     UserService userService,
                                     NotificationService notificationService,
                                     QrCodeService qrCodeService,
                                     EmailService emailService,
                                     NetworkService networkService) {
        this.participationRepository = participationRepository;
        this.activityRepository = activityRepository;
        this.eventService = eventService;
        this.userService = userService;
        this.notificationService = notificationService;
        this.qrCodeService = qrCodeService;
        this.emailService = emailService;
        this.networkService = networkService;
    }

    public EventParticipationResponse participate(CreateEventParticipationRequest request) {
        if (participationRepository.findByEventIdAndUserId(request.eventId(), request.userId()).isPresent()) {
            throw new RuntimeException("Already joined this event");
        }
        
        Event event = eventService.getById(request.eventId());
        User user = userService.getById(request.userId());

        String qrToken = UUID.randomUUID().toString();

        EventParticipation participation = new EventParticipation();
        participation.setEvent(event);
        participation.setUser(user);
        participation.setStatus(EventParticipationStatus.REGISTERED);
        participation.setRegisteredAt(LocalDateTime.now());
        participation.setQrToken(qrToken);
        
        EventParticipation saved = participationRepository.save(participation);

        // Generate QR code pointing to the public info endpoint
        String qrContent = networkService.resolveBaseUrl() + "/api/event-participations/ticket/" + qrToken;
        byte[] qrImage = qrCodeService.generateQrCode(qrContent, 300, 300);

        // Send confirmation email with QR code
        String subject = "Your Registration for: " + event.getTitle();
        String body = "<h2>Hi " + user.getFullName() + ",</h2>"
                + "<p>You have successfully registered for <strong>" + event.getTitle() + "</strong>.</p>"
                + "<p><strong>Location:</strong> " + event.getLocation() + "</p>"
                + "<p><strong>Starts:</strong> " + event.getStartAt() + "</p>"
                + "<p><strong>Ends:</strong> " + event.getEndAt() + "</p>"
                + "<p>Please find your QR code attached. Scan it to view your event details and activities.</p>"
                + "<br><p>Happy Camping!</p>";

        try {
            System.out.println(">>> Sending QR email TO: " + user.getEmail());
            emailService.sendEmailWithQrCode(user.getEmail(), subject, body, qrImage);
            System.out.println(">>> Email sent successfully to: " + user.getEmail());
        } catch (Exception e) {
            System.err.println(">>> FAILED to send QR email to " + user.getEmail() + ": " + e.getMessage());
        }

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

    public QrEventInfoResponse getByQrToken(String token) {
        EventParticipation participation = participationRepository.findByQrToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid QR code"));

        Event event = participation.getEvent();
        User user = participation.getUser();

        List<QrEventInfoResponse.ActivityInfo> activities = activityRepository.findByEventId(event.getId())
            .stream()
            .map(a -> new QrEventInfoResponse.ActivityInfo(a.getId(), a.getName(), a.getDescription()))
            .toList();

        return new QrEventInfoResponse(
            user.getFullName(),
            user.getEmail(),
            event.getTitle(),
            event.getDescription(),
            event.getLocation(),
            event.getStartAt(),
            event.getEndAt(),
            participation.getStatus().name(),
            participation.getRegisteredAt(),
            activities
        );
    }

    public byte[] generateQrImage(String token) {
        participationRepository.findByQrToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid QR token"));
        String url = networkService.resolveBaseUrl() + "/api/event-participations/ticket/" + token;
        return qrCodeService.generateQrCode(url, 300, 300);
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
            participation.getRegisteredAt(),
            participation.getQrToken()
        );
    }
}
