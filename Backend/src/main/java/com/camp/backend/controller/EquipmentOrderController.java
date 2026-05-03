package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateEquipmentOrderRequest;
import com.camp.backend.dto.EquipmentOrderResponse;
import com.camp.backend.service.EquipmentOrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/equipment-orders")
public class EquipmentOrderController {

    private final EquipmentOrderService equipmentOrderService;

    public EquipmentOrderController(EquipmentOrderService equipmentOrderService) {
        this.equipmentOrderService = equipmentOrderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EquipmentOrderResponse>> create(@Valid @RequestBody CreateEquipmentOrderRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Equipment order created", equipmentOrderService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EquipmentOrderResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Equipment orders fetched", equipmentOrderService.findAll()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EquipmentOrderResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Equipment order fetched", equipmentOrderService.getById(id)));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<EquipmentOrderResponse>>> getByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("Equipment orders fetched", equipmentOrderService.findByUserId(userId)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EquipmentOrderResponse>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok("Order status updated", equipmentOrderService.updateStatus(id, status)));
    }
}
