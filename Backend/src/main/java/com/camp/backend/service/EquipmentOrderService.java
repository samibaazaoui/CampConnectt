package com.camp.backend.service;

import com.camp.backend.config.BadRequestException;
import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateEquipmentOrderItemRequest;
import com.camp.backend.dto.CreateEquipmentOrderRequest;
import com.camp.backend.dto.EquipmentOrderItemResponse;
import com.camp.backend.dto.EquipmentOrderResponse;
import com.camp.backend.entity.Equipment;
import com.camp.backend.entity.EquipmentOrder;
import com.camp.backend.entity.EquipmentOrderItem;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EquipmentOrderItemRepository;
import com.camp.backend.repository.EquipmentOrderRepository;
import com.camp.backend.repository.EquipmentRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipmentOrderService {

    private final EquipmentOrderRepository equipmentOrderRepository;
    private final EquipmentOrderItemRepository equipmentOrderItemRepository;
    private final EquipmentService equipmentService;
    private final EquipmentRepository equipmentRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public EquipmentOrderService(EquipmentOrderRepository equipmentOrderRepository,
                                 EquipmentOrderItemRepository equipmentOrderItemRepository,
                                 EquipmentService equipmentService,
                                 EquipmentRepository equipmentRepository,
                                 UserService userService,
                                 NotificationService notificationService) {
        this.equipmentOrderRepository = equipmentOrderRepository;
        this.equipmentOrderItemRepository = equipmentOrderItemRepository;
        this.equipmentService = equipmentService;
        this.equipmentRepository = equipmentRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @Transactional
    public EquipmentOrderResponse create(CreateEquipmentOrderRequest request) {
        User user = userService.getById(request.userId());

        EquipmentOrder order = new EquipmentOrder();
        order.setUser(user);
        EquipmentOrder savedOrder = equipmentOrderRepository.save(order);

        List<EquipmentOrderItem> savedItems = new ArrayList<>();

        for (CreateEquipmentOrderItemRequest itemRequest : request.items()) {
            Equipment equipment = equipmentService.getById(itemRequest.equipmentId());

            // ATOMIC STOCK DEDUCTION
            int updatedRows = equipmentRepository.deductStock(equipment.getId(), itemRequest.quantity());
            if (updatedRows == 0) {
                throw new BadRequestException("Insufficient stock for equipment: " + equipment.getName());
            }

            EquipmentOrderItem orderItem = new EquipmentOrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setEquipment(equipment);
            orderItem.setQuantity(itemRequest.quantity());
            orderItem.setUnitPrice(equipment.getUnitPrice());

            savedItems.add(equipmentOrderItemRepository.save(orderItem));
        }

        // CREATE NOTIFICATION
        notificationService.createNotification(
                user.getId(),
                "Order Placed",
                "Your equipment order #" + savedOrder.getId() + " has been successfully placed.",
                NotificationType.ORDER
        );

        return toResponse(savedOrder, savedItems);
    }

    @Transactional
    public EquipmentOrderResponse updateStatus(Long id, String status) {
        EquipmentOrder order = equipmentOrderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentOrder not found: " + id));

        order.setStatus(com.camp.backend.entity.EquipmentOrderStatus.valueOf(status));
        EquipmentOrder saved = equipmentOrderRepository.save(order);

        // NOTIFY USER OF STATUS CHANGE
        notificationService.createNotification(
                saved.getUser().getId(),
                "Order Status Updated",
                "Your equipment order #" + saved.getId() + " is now " + status + ".",
                NotificationType.ORDER
        );

        List<EquipmentOrderItem> items = equipmentOrderItemRepository.findByOrderId(saved.getId());
        return toResponse(saved, items);
    }

    public List<EquipmentOrderResponse> findAll() {
        return equipmentOrderRepository.findAll().stream().map(order -> {
            List<EquipmentOrderItem> items = equipmentOrderItemRepository.findByOrderId(order.getId());
            return toResponse(order, items);
        }).toList();
    }

    public List<EquipmentOrderResponse> findByUserId(Long userId) {
        return equipmentOrderRepository.findByUserId(userId).stream().map(order -> {
            List<EquipmentOrderItem> items = equipmentOrderItemRepository.findByOrderId(order.getId());
            return toResponse(order, items);
        }).toList();
    }
    
    public EquipmentOrderResponse getById(Long id) {
        EquipmentOrder order = equipmentOrderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("EquipmentOrder not found: " + id));
        List<EquipmentOrderItem> items = equipmentOrderItemRepository.findByOrderId(order.getId());
        return toResponse(order, items);
    }

    private EquipmentOrderResponse toResponse(EquipmentOrder order, List<EquipmentOrderItem> items) {
        List<EquipmentOrderItemResponse> itemResponses = items.stream().map(item ->
            new EquipmentOrderItemResponse(
                item.getId(),
                item.getEquipment().getId(),
                item.getEquipment().getName(),
                item.getQuantity(),
                item.getUnitPrice()
            )
        ).toList();

        return new EquipmentOrderResponse(
            order.getId(),
            order.getUser().getId(),
            order.getUser().getFullName(),
            order.getStatus(),
            order.getCreatedAt(),
            itemResponses
        );
    }
}
