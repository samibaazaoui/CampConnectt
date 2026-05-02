package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateDeliveryRequest;
import com.camp.backend.dto.DeliveryResponse;
import com.camp.backend.entity.Delivery;
import com.camp.backend.entity.DeliveryStatus;
import com.camp.backend.entity.EquipmentOrder;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.repository.DeliveryRepository;
import com.camp.backend.repository.EquipmentOrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final EquipmentOrderRepository equipmentOrderRepository;
    private final NotificationService notificationService;

    public DeliveryService(DeliveryRepository deliveryRepository, 
                           EquipmentOrderRepository equipmentOrderRepository,
                           NotificationService notificationService) {
        this.deliveryRepository = deliveryRepository;
        this.equipmentOrderRepository = equipmentOrderRepository;
        this.notificationService = notificationService;
    }

    public DeliveryResponse create(CreateDeliveryRequest request) {
        EquipmentOrder order = equipmentOrderRepository.findById(request.orderId())
            .orElseThrow(() -> new ResourceNotFoundException("Equipment order not found: " + request.orderId()));

        Delivery delivery = new Delivery();
        delivery.setOrder(order);
        delivery.setDeliveryAddress(request.deliveryAddress());
        delivery.setDeliveryAgent(request.deliveryAgent());
        delivery.setScheduledAt(request.scheduledAt());
        delivery.setStatus(DeliveryStatus.PENDING);
        
        Delivery saved = deliveryRepository.save(delivery);
        return toResponse(saved);
    }

    public DeliveryResponse updateStatus(Long id, DeliveryStatus status) {
        Delivery delivery = deliveryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Delivery not found: " + id));
            
        delivery.setStatus(status);
        if (status == DeliveryStatus.DELIVERED) {
            delivery.setDeliveredAt(LocalDateTime.now());
        }
        
        Delivery saved = deliveryRepository.save(delivery);

        // SEND NOTIFICATION TO ORDER OWNER
        if (saved.getOrder() != null && saved.getOrder().getUser() != null) {
            notificationService.createNotification(
                    saved.getOrder().getUser().getId(),
                    "Delivery Status Updated",
                    "Your delivery for order #" + saved.getOrder().getId() + " is now " + status,
                    NotificationType.DELIVERY
            );
        }

        return toResponse(saved);
    }

    public List<DeliveryResponse> findAll() {
        return deliveryRepository.findAll().stream().map(this::toResponse).toList();
    }
    
    public DeliveryResponse getById(Long id) {
        Delivery delivery = deliveryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Delivery not found: " + id));
        return toResponse(delivery);
    }

    private DeliveryResponse toResponse(Delivery delivery) {
        return new DeliveryResponse(
            delivery.getId(),
            delivery.getOrder() != null ? delivery.getOrder().getId() : null,
            delivery.getDeliveryAddress(),
            delivery.getDeliveryAgent(),
            delivery.getStatus(),
            delivery.getScheduledAt(),
            delivery.getDeliveredAt()
        );
    }
}
