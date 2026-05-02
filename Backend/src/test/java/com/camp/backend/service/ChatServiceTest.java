package com.camp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.camp.backend.dto.ChatMessageResponse;
import com.camp.backend.dto.ChatParticipantResponse;
import com.camp.backend.dto.ChatRoomResponse;
import com.camp.backend.dto.CreateChatMessageRequest;
import com.camp.backend.dto.CreateChatParticipantRequest;
import com.camp.backend.dto.CreateChatRoomRequest;
import com.camp.backend.entity.ChatMessage;
import com.camp.backend.entity.ChatParticipant;
import com.camp.backend.entity.ChatRoom;
import com.camp.backend.entity.User;
import com.camp.backend.repository.ChatMessageRepository;
import com.camp.backend.repository.ChatParticipantRepository;
import com.camp.backend.repository.ChatRoomRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
public class ChatServiceTest {

    @Mock
    private ChatRoomRepository roomRepository;
    @Mock
    private ChatMessageRepository messageRepository;
    @Mock
    private ChatParticipantRepository participantRepository;
    @Mock
    private UserService userService;

    @InjectMocks
    private ChatService chatService;

    private ChatRoom room;
    private User user;

    @BeforeEach
    void setUp() {
        room = new ChatRoom();
        room.setId(1L);
        room.setName("General");

        user = new User();
        user.setId(1L);
        user.setFullName("John Doe");
    }

    @Test
    void createRoom_ShouldReturnRoomResponse() {
        when(roomRepository.save(any(ChatRoom.class))).thenReturn(room);

        ChatRoomResponse response = chatService.createRoom(new CreateChatRoomRequest("General"));

        assertNotNull(response);
        assertEquals("General", response.name());
        verify(roomRepository).save(any(ChatRoom.class));
    }

    @Test
    void addParticipant_ShouldReturnParticipantResponse() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(userService.getById(1L)).thenReturn(user);
        
        ChatParticipant participant = new ChatParticipant();
        participant.setId(10L);
        participant.setRoom(room);
        participant.setUser(user);
        when(participantRepository.save(any(ChatParticipant.class))).thenReturn(participant);

        ChatParticipantResponse response = chatService.addParticipant(new CreateChatParticipantRequest(1L, 1L));

        assertNotNull(response);
        assertEquals("John Doe", response.userFullName());
        verify(participantRepository).save(any(ChatParticipant.class));
    }

    @Test
    void sendMessage_ShouldReturnMessageResponse() {
        when(roomRepository.findById(1L)).thenReturn(Optional.of(room));
        when(userService.getById(1L)).thenReturn(user);

        ChatMessage message = new ChatMessage();
        message.setId(100L);
        message.setRoom(room);
        message.setSender(user);
        message.setContent("Hello");
        message.setIncognito(false);
        when(messageRepository.save(any(ChatMessage.class))).thenReturn(message);

        ChatMessageResponse response = chatService.sendMessage(new CreateChatMessageRequest(1L, 1L, "Hello", false, "TEXT", null));

        assertNotNull(response);
        assertEquals("Hello", response.content());
        assertEquals("John Doe", response.senderName());
    }
}
