package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateDeliveryRequest;
import com.camp.backend.dto.DeliveryResponse;
import com.camp.backend.entity.Delivery;
import com.camp.backend.entity.DeliveryStatus;
import com.camp.backend.entity.EquipmentOrder;
import com.camp.backend.entity.User;
import com.camp.backend.repository.DeliveryRepository;
import com.camp.backend.repository.EquipmentOrderRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;
    @Mock
    private EquipmentOrderRepository equipmentOrderRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private DeliveryService deliveryService;

    private Delivery delivery;
    private EquipmentOrder order;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);

        order = new EquipmentOrder();
        order.setId(10L);
        order.setUser(user);

        delivery = new Delivery();
        delivery.setId(100L);
        delivery.setOrder(order);
        delivery.setDeliveryAddress("123 Main St");
        delivery.setStatus(DeliveryStatus.PENDING);
    }

    @Test
    void create_ShouldReturnDeliveryResponse() {
        when(equipmentOrderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(delivery);

        DeliveryResponse response = deliveryService.create(new CreateDeliveryRequest(10L, "123 Main St", "Agent X", LocalDateTime.now().plusDays(1)));

        assertNotNull(response);
        assertEquals(DeliveryStatus.PENDING, response.status());
        verify(deliveryRepository).save(any(Delivery.class));
    }

    @Test
    void updateStatus_ShouldNotifyUser() {
        when(deliveryRepository.findById(100L)).thenReturn(Optional.of(delivery));
        when(deliveryRepository.save(any(Delivery.class))).thenReturn(delivery);

        deliveryService.updateStatus(100L, DeliveryStatus.DELIVERED);

        verify(notificationService).createNotification(eq(1L), anyString(), anyString(), any());
        verify(deliveryRepository).save(any(Delivery.class));
    }

    @Test
    void getById_WhenExists_ShouldReturnResponse() {
        when(deliveryRepository.findById(100L)).thenReturn(Optional.of(delivery));

        DeliveryResponse response = deliveryService.getById(100L);

        assertNotNull(response);
        assertEquals(100L, response.id());
    }
}
