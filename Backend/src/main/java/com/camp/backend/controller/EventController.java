package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateEventRequest;
import com.camp.backend.dto.EventResponse;
import com.camp.backend.service.EventService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final com.camp.backend.service.ActivityService activityService;
    private final com.camp.backend.service.EventParticipationService participationService;

    public EventController(EventService eventService, 
                           com.camp.backend.service.ActivityService activityService,
                           com.camp.backend.service.EventParticipationService participationService) {
        this.eventService = eventService;
        this.activityService = activityService;
        this.participationService = participationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventResponse>> create(@Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Event created", eventService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Events fetched", eventService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Event fetched", eventService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> update(@PathVariable Long id, @Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Event updated", eventService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        eventService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Event deleted", null));
    }

    @GetMapping("/{id}/activities")
    public ResponseEntity<ApiResponse<List<com.camp.backend.dto.ActivityResponse>>> findActivities(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Activities fetched", activityService.findByEventId(id)));
    }

    @GetMapping("/{id}/is-joined/{userId}")
    public ResponseEntity<ApiResponse<Boolean>> isJoined(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Status fetched", participationService.isUserJoined(id, userId)));
    }
}
