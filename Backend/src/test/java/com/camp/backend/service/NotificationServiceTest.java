package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.entity.Notification;
import com.camp.backend.entity.NotificationStatus;
import com.camp.backend.entity.NotificationType;
import com.camp.backend.entity.User;
import com.camp.backend.repository.NotificationRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserService userService;

    @InjectMocks
    private NotificationService notificationService;

    private User user;
    private Notification notification;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);

        notification = new Notification();
        notification.setId(10L);
        notification.setUser(user);
        notification.setTitle("Alert");
        notification.setStatus(NotificationStatus.UNREAD);
    }

    @Test
    void createNotification_ShouldCallRepositorySave() {
        when(userService.getById(1L)).thenReturn(user);

        notificationService.createNotification(1L, "Title", "Content", NotificationType.SYSTEM);

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void markAsRead_ShouldUpdateStatus() {
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead(10L);

        assertEquals(NotificationStatus.READ, notification.getStatus());
        verify(notificationRepository).save(notification);
    }

    @Test
    void delete_ShouldCallRepositoryDelete() {
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        notificationService.delete(10L);

        verify(notificationRepository).delete(notification);
    }
}
