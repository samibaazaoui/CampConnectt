package com.camp.backend.controller;

import com.camp.backend.config.JwtUtil;
import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CampsiteResponse;
import com.camp.backend.dto.CreateCampsiteRequest;
import com.camp.backend.service.CampsiteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campsites")
public class CampsiteController {

    private final CampsiteService campsiteService;
    private final JwtUtil jwtUtil;

    public CampsiteController(CampsiteService campsiteService, JwtUtil jwtUtil) {
        this.campsiteService = campsiteService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CampsiteResponse>> create(
            @Valid @RequestBody CreateCampsiteRequest request,
            @RequestHeader("Authorization") String token) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ApiResponse.ok("Campsite created", campsiteService.create(request, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CampsiteResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok("Campsites fetched", campsiteService.findAllApprovedPageable(PageRequest.of(page, size))));
    }

    @GetMapping("/approved")
    public ResponseEntity<ApiResponse<List<CampsiteResponse>>> findAllApproved() {
        return ResponseEntity.ok(ApiResponse.ok("Approved campsites fetched", campsiteService.findAllApproved()));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<CampsiteResponse>>> findPending() {
        return ResponseEntity.ok(ApiResponse.ok("Pending campsites fetched", campsiteService.findPending()));
    }

    @GetMapping("/owner")
    public ResponseEntity<ApiResponse<List<CampsiteResponse>>> findByOwner(@RequestHeader("Authorization") String token) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ApiResponse.ok("Owner campsites fetched", campsiteService.findByOwnerId(userId)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<CampsiteResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Campsite approved", campsiteService.approve(id)));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<CampsiteResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Campsite cancelled", campsiteService.cancel(id)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<java.util.List<CampsiteResponse>>> findAllList() {
        return ResponseEntity.ok(ApiResponse.ok("All campsites fetched", campsiteService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampsiteResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Campsite fetched", campsiteService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CampsiteResponse>> update(@PathVariable Long id, @Valid @RequestBody CreateCampsiteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Campsite updated", campsiteService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        campsiteService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Campsite deleted", null));
    }
}
