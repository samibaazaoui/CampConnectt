package com.camp.backend.controller;

import com.camp.backend.dto.*;
import com.camp.backend.entity.EquipmentOrder;
import com.camp.backend.entity.EquipmentOrderStatus;
import com.camp.backend.entity.User;
import com.camp.backend.entity.UserRole;
import com.camp.backend.service.EquipmentOrderService;
import com.camp.backend.service.UserService;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    @Autowired

    private  EquipmentOrderService equipmentOrderService;
    @Autowired
    private UserService userService;

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
    @GetMapping("/orders/user/{name}")
    public ResponseEntity<List<EquipmentOrder>> getOrders(@PathVariable String name) {
        return ResponseEntity.ok(equipmentOrderService.getOrdersByUser(name));
    }
    @GetMapping("/orders/filter")
    public List<EquipmentOrder> filter(
            @RequestParam UserRole role,
            @RequestParam EquipmentOrderStatus status) {

        return equipmentOrderService.getOrdersByRoleAndStatus(role, status);
    }
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<List<EquipmentStatsProjection>>> getApprovedEquipmentStats() {
        return ResponseEntity.ok(
                ApiResponse.ok(
                        "Approved equipment stats fetched",
                        equipmentOrderService.getApprovedEquipmentStats()
                )
        );
    }
    @GetMapping("/owner/users")
    public List<UserResponse> getMyCustomers(Authentication authentication) {
        String email = authentication.getName(); // هذا يجيب email
        User currentUser = userService.findByEmail(email);

        return equipmentOrderService.getUsersWhoOrderedMyEquipment(currentUser.getId());
    }



}
