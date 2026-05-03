package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateEventParticipationRequest;
import com.camp.backend.dto.EventParticipationResponse;
import com.camp.backend.entity.EventParticipationStatus;
import com.camp.backend.service.EventParticipationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/event-participations")
public class EventParticipationController {

    private final EventParticipationService participationService;

    public EventParticipationController(EventParticipationService participationService) {
        this.participationService = participationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventParticipationResponse>> participate(@Valid @RequestBody CreateEventParticipationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Event participation registered", participationService.participate(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventParticipationResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Event participations fetched", participationService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventParticipationResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Event participation fetched", participationService.findById(id)));
    }
    
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<EventParticipationResponse>>> findByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok("Event participations fetched", participationService.findByEventId(eventId)));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<EventParticipationResponse>>> findByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("User event participations fetched", participationService.findByUserId(userId)));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EventParticipationResponse>> updateStatus(@PathVariable Long id, @RequestParam EventParticipationStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Status updated", participationService.updateStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        participationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Event participation deleted", null));
    }
}
