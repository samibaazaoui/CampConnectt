package com.camp.backend.controller;

import com.camp.backend.config.JwtUtil;
import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateEquipmentRequest;
import com.camp.backend.dto.EquipmentResponse;
import com.camp.backend.service.EquipmentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/equipments")
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final JwtUtil jwtUtil;

    public EquipmentController(EquipmentService equipmentService, JwtUtil jwtUtil) {
        this.equipmentService = equipmentService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EquipmentResponse>> create(
            @Valid @RequestBody CreateEquipmentRequest request,
            @RequestHeader("Authorization") String token) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ApiResponse.ok("Equipment created", equipmentService.create(request, userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Equipments fetched", equipmentService.findAllApproved()));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> findAllAdmin() {
        return ResponseEntity.ok(ApiResponse.ok("All equipments fetched", equipmentService.findAll()));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> findPending() {
        return ResponseEntity.ok(ApiResponse.ok("Pending equipments fetched", equipmentService.findPending()));
    }

    @GetMapping("/owner")
    public ResponseEntity<ApiResponse<List<EquipmentResponse>>> findByOwner(@RequestHeader("Authorization") String token) {
        Long userId = jwtUtil.extractUserId(token.substring(7));
        return ResponseEntity.ok(ApiResponse.ok("Owner equipments fetched", equipmentService.findByOwnerId(userId)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<EquipmentResponse>> approve(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Equipment approved", equipmentService.approve(id)));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<EquipmentResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Equipment cancelled", equipmentService.cancel(id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Equipment fetched", equipmentService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentResponse>> update(@PathVariable Long id, @Valid @RequestBody CreateEquipmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Equipment updated", equipmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        equipmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Equipment deleted", null));
    }
}
