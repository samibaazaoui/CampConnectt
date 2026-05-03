package com.camp.backend.controller;

import com.camp.backend.dto.ActivityResponse;
import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateActivityRequest;
import com.camp.backend.service.ActivityService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ActivityResponse>> create(@Valid @RequestBody CreateActivityRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Activity created", activityService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Activities fetched", activityService.findAll()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ActivityResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Activity fetched", activityService.findById(id)));
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> findByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok("Activities for event fetched", activityService.findByEventId(eventId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ActivityResponse>> update(@PathVariable Long id, @Valid @RequestBody CreateActivityRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Activity updated", activityService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        activityService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Activity deleted", null));
    }
}
