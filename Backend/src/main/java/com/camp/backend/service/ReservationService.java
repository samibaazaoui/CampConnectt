package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateReservationRequest;
import com.camp.backend.dto.ReservationResponse;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.entity.Reservation;
import com.camp.backend.entity.ReservationStatus;
import com.camp.backend.repository.ReservationRepository;
import com.camp.backend.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final CampsiteService campsiteService;
    private final NotificationService notificationService;

    public ReservationService(
        ReservationRepository reservationRepository,
        UserRepository userRepository,
        CampsiteService campsiteService,
        NotificationService notificationService
    ) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.campsiteService = campsiteService;
        this.notificationService = notificationService;
    }

    public ReservationResponse create(CreateReservationRequest request) {
        // VALIDATE DATES
        if (request.startDate().isAfter(request.endDate())) {
            throw new RuntimeException("Start date cannot be after end date.");
        }

        // CHECK FOR OVERLAPS
        List<Reservation> overlaps = reservationRepository.findOverlappingReservations(
                request.campsiteId(), request.startDate(), request.endDate()
        );
        if (!overlaps.isEmpty()) {
            throw new RuntimeException("Campsite already reserved for these dates.");
        }

        Reservation reservation = new Reservation();
        reservation.setUser(userRepository.findById(request.userId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.userId())));
        reservation.setCampsite(campsiteService.getById(request.campsiteId()));
        reservation.setStartDate(request.startDate());
        reservation.setEndDate(request.endDate());
        reservation.setStatus(ReservationStatus.PENDING);
        
        Reservation saved = reservationRepository.save(reservation);

        // CREATE NOTIFICATION
        notificationService.createNotification(
                saved.getUser().getId(),
                "Reservation Requested",
                "Your reservation for " + saved.getCampsite().getName() + " is PENDING.",
                NotificationType.RESERVATION
        );

        return toResponse(saved);
    }

    public List<ReservationResponse> findAll() {
        return reservationRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<ReservationResponse> findByUserId(Long userId) {
        return reservationRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public ReservationResponse findById(Long id) {
        return toResponse(getById(id));
    }

    public Reservation getById(Long id) {
        return reservationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + id));
    }

    public ReservationResponse updateStatus(Long id, ReservationStatus status) {
        Reservation reservation = getById(id);
        
        // IF CONFIRMING, RE-CHECK OVERLAPS
        if (status == ReservationStatus.CONFIRMED) {
            List<Reservation> overlaps = reservationRepository.findOverlappingReservations(
                    reservation.getCampsite().getId(), reservation.getStartDate(), reservation.getEndDate()
            );
            if (!overlaps.isEmpty()) {
                throw new RuntimeException("Cannot confirm: Overlap detected.");
            }
        }

        reservation.setStatus(status);
        Reservation saved = reservationRepository.save(reservation);

        // NOTIFICATION
        notificationService.createNotification(
                saved.getUser().getId(),
                "Reservation Status Updated",
                "Your reservation for " + saved.getCampsite().getName() + " is now " + status,
                NotificationType.RESERVATION
        );

        return toResponse(saved);
    }

    public void delete(Long id) {
        Reservation reservation = getById(id);
        reservationRepository.delete(reservation);
    }

    private ReservationResponse toResponse(Reservation reservation) {
        return new ReservationResponse(
            reservation.getId(),
            reservation.getUser().getId(),
            reservation.getUser().getFullName(),
            reservation.getCampsite().getId(),
            reservation.getCampsite().getName(),
            reservation.getCampsite().getLocation(),
            reservation.getStartDate(),
            reservation.getEndDate(),
            reservation.getStatus()
        );
    }
}
