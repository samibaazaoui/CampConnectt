package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateDeliveryRequest;
import com.camp.backend.dto.DeliveryResponse;
import com.camp.backend.entity.DeliveryStatus;
import com.camp.backend.service.DeliveryService;
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
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryResponse>> create(@Valid @RequestBody CreateDeliveryRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Delivery created", deliveryService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Deliveries fetched", deliveryService.findAll()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Delivery fetched", deliveryService.getById(id)));
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DeliveryResponse>> updateStatus(@PathVariable Long id, @RequestParam DeliveryStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Delivery status updated", deliveryService.updateStatus(id, status)));
    }
}
