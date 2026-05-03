package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateEventParticipationRequest;
import com.camp.backend.dto.EventParticipationResponse;
import com.camp.backend.dto.QrEventInfoResponse;
import com.camp.backend.entity.Activity;
import com.camp.backend.entity.Event;
import com.camp.backend.entity.EventParticipation;
import com.camp.backend.entity.EventParticipationStatus;
import com.camp.backend.entity.User;
import com.camp.backend.repository.ActivityRepository;
import com.camp.backend.repository.EventParticipationRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
public class EventParticipationServiceTest {

    @Mock
    private EventParticipationRepository participationRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private EventService eventService;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private QrCodeService qrCodeService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private EventParticipationService participationService;

    private Event event;
    private User user;
    private EventParticipation participation;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(participationService, "baseUrl", "http://localhost:8080");

        event = new Event();
        event.setId(1L);
        event.setTitle("Adventure Camp");
        event.setDescription("A great outdoor adventure");
        event.setLocation("Forest Park");
        event.setStartAt(LocalDateTime.of(2026, 5, 10, 9, 0));
        event.setEndAt(LocalDateTime.of(2026, 5, 12, 18, 0));

        user = new User();
        user.setId(5L);
        user.setFullName("Jane Doe");
        user.setEmail("bechi.benslimene@esprit.tn");

        participation = new EventParticipation();
        participation.setId(10L);
        participation.setEvent(event);
        participation.setUser(user);
        participation.setStatus(EventParticipationStatus.REGISTERED);
        participation.setQrToken("test-token-123");
        participation.setRegisteredAt(LocalDateTime.now());
    }

    @Test
    void participate_ShouldGenerateQrTokenAndSendEmail() {
        when(eventService.getById(1L)).thenReturn(event);
        when(userService.getById(5L)).thenReturn(user);
        when(participationRepository.findByEventIdAndUserId(1L, 5L)).thenReturn(Optional.empty());
        when(participationRepository.save(any(EventParticipation.class))).thenReturn(participation);
        when(qrCodeService.generateQrCode(anyString(), anyInt(), anyInt())).thenReturn(new byte[]{1, 2, 3});

        EventParticipationResponse response = participationService.participate(new CreateEventParticipationRequest(1L, 5L));

        assertNotNull(response);
        assertEquals(EventParticipationStatus.REGISTERED, response.status());

        // Verify QR code was generated
        ArgumentCaptor<String> qrContentCaptor = ArgumentCaptor.forClass(String.class);
        verify(qrCodeService).generateQrCode(qrContentCaptor.capture(), eq(300), eq(300));
        assertTrue(qrContentCaptor.getValue().startsWith("http://localhost:8080/api/event-participations/qr/"));

        // Verify email was sent to the user
        verify(emailService).sendEmailWithQrCode(
                eq("bechi.benslimene@esprit.tn"),
                anyString(),
                anyString(),
                any(byte[].class)
        );

        // Verify notification was created
        verify(notificationService).createNotification(eq(5L), anyString(), anyString(), any());
    }

    @Test
    void participate_ShouldSaveQrTokenOnParticipation() {
        when(eventService.getById(1L)).thenReturn(event);
        when(userService.getById(5L)).thenReturn(user);
        when(participationRepository.findByEventIdAndUserId(1L, 5L)).thenReturn(Optional.empty());
        when(participationRepository.save(any(EventParticipation.class))).thenReturn(participation);
        when(qrCodeService.generateQrCode(anyString(), anyInt(), anyInt())).thenReturn(new byte[]{1});

        participationService.participate(new CreateEventParticipationRequest(1L, 5L));

        ArgumentCaptor<EventParticipation> captor = ArgumentCaptor.forClass(EventParticipation.class);
        verify(participationRepository).save(captor.capture());
        assertNotNull(captor.getValue().getQrToken(), "QR token should be set before saving");
    }

    @Test
    void participate_ShouldStillSucceedIfEmailFails() {
        when(eventService.getById(1L)).thenReturn(event);
        when(userService.getById(5L)).thenReturn(user);
        when(participationRepository.findByEventIdAndUserId(1L, 5L)).thenReturn(Optional.empty());
        when(participationRepository.save(any(EventParticipation.class))).thenReturn(participation);
        when(qrCodeService.generateQrCode(anyString(), anyInt(), anyInt())).thenReturn(new byte[]{1});
        doThrow(new RuntimeException("SMTP error")).when(emailService)
                .sendEmailWithQrCode(anyString(), anyString(), anyString(), any(byte[].class));

        EventParticipationResponse response = participationService.participate(new CreateEventParticipationRequest(1L, 5L));

        assertNotNull(response, "Participation should succeed even if email fails");
        assertEquals(EventParticipationStatus.REGISTERED, response.status());
    }

    @Test
    void getByQrToken_ShouldReturnEventInfoWithActivities() {
        Activity activity1 = new Activity();
        activity1.setId(100L);
        activity1.setName("Guided Forest Hike");
        activity1.setDescription("Explore the lush greenery");
        activity1.setEvent(event);

        Activity activity2 = new Activity();
        activity2.setId(101L);
        activity2.setName("Stargazing Night");
        activity2.setDescription("Observe the cosmos");
        activity2.setEvent(event);

        when(participationRepository.findByQrToken("test-token-123")).thenReturn(Optional.of(participation));
        when(activityRepository.findByEventId(1L)).thenReturn(List.of(activity1, activity2));

        QrEventInfoResponse response = participationService.getByQrToken("test-token-123");

        assertNotNull(response);
        assertEquals("Jane Doe", response.participantName());
        assertEquals("bechi.benslimene@esprit.tn", response.participantEmail());
        assertEquals("Adventure Camp", response.eventTitle());
        assertEquals("A great outdoor adventure", response.eventDescription());
        assertEquals("Forest Park", response.eventLocation());
        assertEquals("REGISTERED", response.participationStatus());
        assertEquals(2, response.activities().size());
        assertEquals("Guided Forest Hike", response.activities().get(0).name());
        assertEquals("Stargazing Night", response.activities().get(1).name());
    }

    @Test
    void getByQrToken_ShouldThrowWhenTokenInvalid() {
        when(participationRepository.findByQrToken("invalid-token")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            participationService.getByQrToken("invalid-token");
        });
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
