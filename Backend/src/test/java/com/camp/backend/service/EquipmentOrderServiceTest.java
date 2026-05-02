package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateEquipmentOrderItemRequest;
import com.camp.backend.dto.CreateEquipmentOrderRequest;
import com.camp.backend.dto.EquipmentOrderResponse;
import com.camp.backend.entity.Equipment;
import com.camp.backend.entity.EquipmentOrder;
import com.camp.backend.entity.EquipmentOrderItem;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EquipmentOrderItemRepository;
import com.camp.backend.repository.EquipmentOrderRepository;
import com.camp.backend.repository.EquipmentRepository;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class EquipmentOrderServiceTest {

    @Mock
    private EquipmentOrderRepository equipmentOrderRepository;
    @Mock
    private EquipmentOrderItemRepository equipmentOrderItemRepository;
    @Mock
    private EquipmentService equipmentService;
    @Mock
    private EquipmentRepository equipmentRepository;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private EquipmentOrderService equipmentOrderService;

    private User user;
    private Equipment equipment;
    private EquipmentOrder order;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setFullName("Customer");

        equipment = new Equipment();
        equipment.setId(50L);
        equipment.setName("Tent");
        equipment.setUnitPrice(100.0);

        order = new EquipmentOrder();
        order.setId(100L);
        order.setUser(user);
    }

    @Test
    void create_WithSufficientStock_ShouldSucceed() {
        when(userService.getById(1L)).thenReturn(user);
        when(equipmentOrderRepository.save(any(EquipmentOrder.class))).thenReturn(order);
        when(equipmentService.getById(50L)).thenReturn(equipment);
        when(equipmentRepository.deductStock(50L, 2)).thenReturn(1);
        
        EquipmentOrderItem item = new EquipmentOrderItem();
        item.setId(1L);
        item.setEquipment(equipment);
        item.setQuantity(2);
        item.setUnitPrice(100.0);
        when(equipmentOrderItemRepository.save(any())).thenReturn(item);

        CreateEquipmentOrderRequest request = new CreateEquipmentOrderRequest(1L, 
            Collections.singletonList(new CreateEquipmentOrderItemRequest(50L, 2)));

        EquipmentOrderResponse response = equipmentOrderService.create(request);

        assertNotNull(response);
        verify(equipmentRepository).deductStock(50L, 2);
        verify(notificationService).createNotification(anyLong(), anyString(), anyString(), any());
    }

    @Test
    void create_WithInsufficientStock_ShouldThrowException() {
        when(userService.getById(1L)).thenReturn(user);
        when(equipmentOrderRepository.save(any(EquipmentOrder.class))).thenReturn(order);
        when(equipmentService.getById(50L)).thenReturn(equipment);
        when(equipmentRepository.deductStock(50L, 2)).thenReturn(0);

        CreateEquipmentOrderRequest request = new CreateEquipmentOrderRequest(1L, 
            Collections.singletonList(new CreateEquipmentOrderItemRequest(50L, 2)));

        assertThrows(RuntimeException.class, () -> equipmentOrderService.create(request));
    }

    @Test
    void updateStatus_ShouldNotifyUser() {
        when(equipmentOrderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(equipmentOrderRepository.save(any(EquipmentOrder.class))).thenReturn(order);
        when(equipmentOrderItemRepository.findByOrderId(100L)).thenReturn(Collections.emptyList());

        equipmentOrderService.updateStatus(100L, "SHIPPED");

        verify(notificationService).createNotification(eq(1L), anyString(), anyString(), any());
    }
}
