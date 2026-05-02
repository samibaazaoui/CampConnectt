package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mock.*;
import static org.mockito.Mockito.*;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateUserRequest;
import com.camp.backend.dto.UserResponse;
import com.camp.backend.entity.User;
import com.camp.backend.entity.UserRole;
import com.camp.backend.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;
    private CreateUserRequest createUserRequest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@camp.com");
        user.setPassword("encoded_password");
        user.setFullName("Test User");
        user.setRole(UserRole.USER);

        createUserRequest = new CreateUserRequest("test@camp.com", "password123", "Test User", UserRole.USER);
    }

    @Test
    void create_ShouldSaveAndReturnResponse() {
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse response = userService.create(createUserRequest);

        assertNotNull(response);
        assertEquals(user.getEmail(), response.email());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void authenticate_WithCorrectCredentials_ShouldReturnUser() {
        when(userRepository.findByEmail("test@camp.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);

        User result = userService.authenticate("test@camp.com", "password123");

        assertNotNull(result);
        assertEquals("test@camp.com", result.getEmail());
    }

    @Test
    void authenticate_WithInvalidEmail_ShouldThrowException() {
        when(userRepository.findByEmail("wrong@camp.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.authenticate("wrong@camp.com", "password123");
        });
    }

    @Test
    void authenticate_WithInvalidPassword_ShouldThrowException() {
        when(userRepository.findByEmail("test@camp.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_password", "encoded_password")).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.authenticate("test@camp.com", "wrong_password");
        });
    }

    @Test
    void getById_WhenNotExists_ShouldThrowException() {
        when(userRepository.findById(100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.getById(100L);
        });
    }
}
