package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
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
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    private final ChatRoomRepository roomRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatParticipantRepository participantRepository;
    private final UserService userService;

    public ChatService(ChatRoomRepository roomRepository,
                       ChatMessageRepository messageRepository,
                       ChatParticipantRepository participantRepository,
                       UserService userService) {
        this.roomRepository = roomRepository;
        this.messageRepository = messageRepository;
        this.participantRepository = participantRepository;
        this.userService = userService;
    }

    public ChatRoomResponse createRoom(CreateChatRoomRequest request) {
        ChatRoom room = new ChatRoom();
        room.setName(request.name());
        ChatRoom saved = roomRepository.save(room);
        return toRoomResponse(saved);
    }
    
    public List<ChatRoomResponse> findAllRooms() {
        return roomRepository.findAll().stream().map(this::toRoomResponse).toList();
    }
    
    public ChatRoomResponse findRoomById(Long id) {
        return toRoomResponse(getRoomEntityById(id));
    }

    public ChatRoom getRoomEntityById(Long id) {
        return roomRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Chat room not found: " + id));
    }

    public void deleteRoom(Long id) {
        ChatRoom room = getRoomEntityById(id);
        roomRepository.delete(room);
    }

    public ChatParticipantResponse addParticipant(CreateChatParticipantRequest request) {
        ChatRoom room = getRoomEntityById(request.roomId());
        User user = userService.getById(request.userId());
        
        ChatParticipant participant = new ChatParticipant();
        participant.setRoom(room);
        participant.setUser(user);
        
        ChatParticipant saved = participantRepository.save(participant);
        return toParticipantResponse(saved);
    }
    
    public List<ChatParticipantResponse> getParticipantsByRoomId(Long roomId) {
        return participantRepository.findByRoomId(roomId).stream().map(this::toParticipantResponse).toList();
    }

    public void removeParticipant(Long participationId) {
        ChatParticipant participation = participantRepository.findById(participationId)
            .orElseThrow(() -> new ResourceNotFoundException("Participation not found: " + participationId));
        participantRepository.delete(participation);
    }

    public ChatMessageResponse sendMessage(CreateChatMessageRequest request) {
        ChatRoom room = getRoomEntityById(request.roomId());
        User sender = userService.getById(request.senderId());
        
        ChatMessage message = new ChatMessage();
        message.setRoom(room);
        message.setSender(sender);
        message.setContent(request.content());
        
        ChatMessage saved = messageRepository.save(message);
        return toMessageResponse(saved);
    }

    public List<ChatMessageResponse> getMessagesByRoomId(Long roomId) {
        return messageRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
                .map(this::toMessageResponse).toList();
    }

    public void deleteMessage(Long messageId) {
        ChatMessage message = messageRepository.findById(messageId)
            .orElseThrow(() -> new ResourceNotFoundException("Message not found: " + messageId));
        messageRepository.delete(message);
    }

    private ChatRoomResponse toRoomResponse(ChatRoom room) {
        return new ChatRoomResponse(room.getId(), room.getName(), room.getCreatedAt());
    }

    private ChatParticipantResponse toParticipantResponse(ChatParticipant participant) {
        return new ChatParticipantResponse(
            participant.getId(),
            participant.getRoom().getId(),
            participant.getRoom().getName(),
            participant.getUser().getId(),
            participant.getUser().getFullName(),
            participant.getJoinedAt()
        );
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
            message.getId(),
            message.getRoom().getId(),
            message.getSender().getId(),
            message.getSender().getFullName(),
            message.getContent(),
            message.getSentAt()
        );
    }
}
