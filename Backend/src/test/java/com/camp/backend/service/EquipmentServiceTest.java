package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateEquipmentRequest;
import com.camp.backend.dto.EquipmentResponse;
import com.camp.backend.entity.Equipment;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EquipmentRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private EquipmentService equipmentService;

    private Equipment equipment;
    private User owner;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setFullName("Test Owner");

        equipment = new Equipment();
        equipment.setId(1L);
        equipment.setName("Sleeping Bag");
        equipment.setQuantityInStock(10);
        equipment.setUnitPrice(45.0);
        equipment.setOwner(owner);
    }

    @Test
    void create_ShouldReturnEquipmentResponse() {
        when(userService.getById(1L)).thenReturn(owner);
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(equipment);

        EquipmentResponse response = equipmentService.create(new CreateEquipmentRequest("Sleeping Bag", "Warm", 10, 45.0, "url"), 1L);

        assertNotNull(response);
        assertEquals("Sleeping Bag", response.name());
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void getById_WhenExists_ShouldReturnEquipment() {
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));

        Equipment result = equipmentService.getById(1L);

        assertEquals(1L, result.getId());
        assertEquals("Sleeping Bag", result.getName());
    }

    @Test
    void update_ShouldUpdateAndReturnResponse() {
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));
        when(equipmentRepository.save(any(Equipment.class))).thenReturn(equipment);

        EquipmentResponse response = equipmentService.update(1L, new CreateEquipmentRequest("New Name", "New Desc", 5, 50.0, "new url"));

        assertNotNull(response);
        verify(equipmentRepository).save(any(Equipment.class));
    }

    @Test
    void delete_ShouldCallRepositoryDelete() {
        when(equipmentRepository.findById(1L)).thenReturn(Optional.of(equipment));

        equipmentService.delete(1L);

        verify(equipmentRepository).delete(equipment);
    }
}
