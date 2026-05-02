package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateReservationRequest;
import com.camp.backend.dto.ReservationResponse;
import com.camp.backend.entity.Campsite;
import com.camp.backend.entity.Reservation;
import com.camp.backend.entity.ReservationStatus;
import com.camp.backend.entity.User;
import com.camp.backend.repository.ReservationRepository;
import com.camp.backend.repository.UserRepository;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CampsiteService campsiteService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ReservationService reservationService;

    private User user;
    private Campsite campsite;
    private Reservation reservation;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setFullName("Camper");

        campsite = new Campsite();
        campsite.setId(5L);
        campsite.setName("Forest Spot");

        reservation = new Reservation();
        reservation.setId(100L);
        reservation.setUser(user);
        reservation.setCampsite(campsite);
        reservation.setStartDate(LocalDate.now().plusDays(1));
        reservation.setEndDate(LocalDate.now().plusDays(3));
        reservation.setStatus(ReservationStatus.PENDING);
    }

    @Test
    void create_WhenNoOverlap_ShouldSucceed() {
        when(reservationRepository.findOverlappingReservations(any(), any(), any())).thenReturn(Collections.emptyList());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(campsiteService.getById(5L)).thenReturn(campsite);
        when(reservationRepository.save(any(Reservation.class))).thenReturn(reservation);

        CreateReservationRequest request = new CreateReservationRequest(1L, 5L, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3));
        ReservationResponse response = reservationService.create(request);

        assertNotNull(response);
        verify(notificationService).createNotification(eq(1L), anyString(), anyString(), any());
    }

    @Test
    void create_WhenOverlap_ShouldThrowException() {
        when(reservationRepository.findOverlappingReservations(any(), any(), any())).thenReturn(Collections.singletonList(new Reservation()));

        CreateReservationRequest request = new CreateReservationRequest(1L, 5L, LocalDate.now().plusDays(1), LocalDate.now().plusDays(3));
        assertThrows(RuntimeException.class, () -> reservationService.create(request));
    }

    @Test
    void updateStatus_ToConfirmed_ShouldRecheckOverlap() {
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(reservation));
        when(reservationRepository.findOverlappingReservations(any(), any(), any())).thenReturn(Collections.emptyList());
        when(reservationRepository.save(any(Reservation.class))).thenReturn(reservation);

        reservationService.updateStatus(100L, ReservationStatus.CONFIRMED);

        verify(reservationRepository).findOverlappingReservations(eq(5L), any(), any());
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());
    }
}
