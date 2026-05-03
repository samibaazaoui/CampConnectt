package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateReservationRequest;
import com.camp.backend.dto.ReservationResponse;
import com.camp.backend.entity.ReservationStatus;
import com.camp.backend.service.ReservationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReservationResponse>> create(@Valid @RequestBody CreateReservationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Reservation created", reservationService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Reservations fetched", reservationService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReservationResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Reservation fetched", reservationService.findById(id)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReservationResponse>>> findByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Reservations fetched", reservationService.findByUserId(userId)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ReservationResponse>> updateStatus(@PathVariable Long id, @RequestParam ReservationStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Reservation status updated", reservationService.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        reservationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Reservation deleted", null));
    }
}
