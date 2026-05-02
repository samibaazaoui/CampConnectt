package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.CreateForumPostRequest;
import com.camp.backend.dto.ForumPostResponse;
import com.camp.backend.entity.ForumPost;
import com.camp.backend.entity.User;
import com.camp.backend.repository.ForumCommentRepository;
import com.camp.backend.repository.ForumPostRepository;
import com.camp.backend.repository.UserRepository;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class ForumServiceTest {

    @Mock
    private ForumPostRepository postRepository;
    @Mock
    private ForumCommentRepository commentRepository;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ForumService forumService;

    private User author;
    private ForumPost post;

    @BeforeEach
    void setUp() {
        author = new User();
        author.setId(1L);
        author.setFullName("John Doe");

        post = new ForumPost();
        post.setId(10L);
        post.setTitle("Camping Tips");
        post.setContent("Always bring water.");
        post.setAuthor(author);
    }

    @Test
    void createPost_ShouldBroadcastToOthers() {
        when(userService.getById(1L)).thenReturn(author);
        when(postRepository.save(any(ForumPost.class))).thenReturn(post);
        
        User otherUser = new User();
        otherUser.setId(2L);
        when(userRepository.findAll()).thenReturn(Collections.singletonList(otherUser));

        ForumPostResponse response = forumService.createPost(new CreateForumPostRequest("Camping Tips", "Always bring water.", 1L));

        assertNotNull(response);
        verify(notificationService).createNotification(eq(2L), anyString(), anyString(), any());
        verify(notificationService, never()).createNotification(eq(1L), anyString(), anyString(), any());
    }

    @Test
    void getPostById_WhenExists_ShouldReturnResponse() {
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));

        ForumPostResponse response = forumService.getPostById(10L);

        assertEquals("Camping Tips", response.title());
    }

    @Test
    void deletePost_ShouldCallRepository() {
        when(postRepository.findById(10L)).thenReturn(Optional.of(post));

        forumService.deletePost(10L);

        verify(postRepository).delete(post);
    }
}
