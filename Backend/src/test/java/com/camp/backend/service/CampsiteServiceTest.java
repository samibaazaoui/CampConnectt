package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CampsiteResponse;
import com.camp.backend.dto.CreateCampsiteRequest;
import com.camp.backend.entity.Campsite;
import com.camp.backend.entity.User;
import com.camp.backend.repository.CampsiteRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class CampsiteServiceTest {

    @Mock
    private CampsiteRepository campsiteRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private CampsiteService campsiteService;

    private Campsite campsite;
    private CreateCampsiteRequest createRequest;
    private User owner;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setFullName("Test Owner");

        campsite = new Campsite();
        campsite.setId(1L);
        campsite.setName("Camp A");
        campsite.setLocation("Location A");
        campsite.setCapacity(4);
        campsite.setNightlyPrice(50.0);
        campsite.setOwner(owner);

        createRequest = new CreateCampsiteRequest("Camp A", "Location A", 4, 50.0, "image.url");
    }

    @Test
    void create_ShouldReturnCampsiteResponse() {
        when(userService.getById(1L)).thenReturn(owner);
        when(campsiteRepository.save(any(Campsite.class))).thenReturn(campsite);

        CampsiteResponse response = campsiteService.create(createRequest, 1L);

        assertNotNull(response);
        assertEquals(campsite.getName(), response.name());
        verify(campsiteRepository, times(1)).save(any(Campsite.class));
    }

    @Test
    void getById_WhenExists_ShouldReturnCampsite() {
        when(campsiteRepository.findById(1L)).thenReturn(Optional.of(campsite));

        Campsite result = campsiteService.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Camp A", result.getName());
    }

    @Test
    void getById_WhenNotExists_ShouldThrowException() {
        when(campsiteRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            campsiteService.getById(1L);
        });
    }

    @Test
    void delete_ShouldCallRepositoryDelete() {
        when(campsiteRepository.findById(1L)).thenReturn(Optional.of(campsite));

        campsiteService.delete(1L);

        verify(campsiteRepository, times(1)).delete(campsite);
    }
}
