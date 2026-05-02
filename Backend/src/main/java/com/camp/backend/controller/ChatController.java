package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.ChatMessageResponse;
import com.camp.backend.dto.ChatParticipantResponse;
import com.camp.backend.dto.ChatRoomResponse;
import com.camp.backend.dto.ChatStatsResponse;
import com.camp.backend.dto.CreateChatMessageRequest;
import com.camp.backend.dto.CreateChatParticipantRequest;
import com.camp.backend.dto.CreateChatRoomRequest;
import com.camp.backend.entity.UserRole;
import com.camp.backend.service.ChatService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/stats/user/{userId}")
    public ResponseEntity<ApiResponse<ChatStatsResponse>> getUserChatStats(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.ok("User chat stats fetched", chatService.getUserChatStats(userId)));
    }

    @GetMapping("/rooms/{roomId}/messages/role")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessagesByRole(
            @PathVariable Long roomId, 
            @RequestParam UserRole role) {
        return ResponseEntity.ok(ApiResponse.ok("Messages fetched by role", chatService.getMessagesByRole(roomId, role)));
    }

    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> createRoom(@Valid @RequestBody CreateChatRoomRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Room created", chatService.createRoom(request)));
    }

    /**
     * Create a One-to-One private room between two users.
     */
    @PostMapping("/rooms/one-to-one")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> createOneToOneRoom(@RequestBody Map<String, Long> body) {
        Long userId1 = body.get("userId1");
        Long userId2 = body.get("userId2");
        return ResponseEntity.ok(ApiResponse.ok("One-to-one room created", chatService.createOneToOneRoom(userId1, userId2)));
    }

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> findAllRooms() {
        return ResponseEntity.ok(ApiResponse.ok("Rooms fetched", chatService.findAllRooms()));
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> findRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Room fetched", chatService.findRoomById(id)));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable Long id) {
        chatService.deleteRoom(id);
        return ResponseEntity.ok(ApiResponse.ok("Room deleted", null));
    }

    @PostMapping("/participants")
    public ResponseEntity<ApiResponse<ChatParticipantResponse>> addParticipant(@Valid @RequestBody CreateChatParticipantRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Participant added", chatService.addParticipant(request)));
    }
    
    @GetMapping("/rooms/{roomId}/participants")
    public ResponseEntity<ApiResponse<List<ChatParticipantResponse>>> getParticipantsByRoomId(@PathVariable Long roomId) {
        return ResponseEntity.ok(ApiResponse.ok("Participants fetched", chatService.getParticipantsByRoomId(roomId)));
    }

    @DeleteMapping("/participants/{participationId}")
    public ResponseEntity<ApiResponse<Void>> removeParticipant(@PathVariable Long participationId) {
        chatService.removeParticipant(participationId);
        return ResponseEntity.ok(ApiResponse.ok("Participant removed", null));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(@Valid @RequestBody CreateChatMessageRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Message sent", chatService.sendMessage(request)));
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessagesByRoomId(@PathVariable Long roomId) {
        return ResponseEntity.ok(ApiResponse.ok("Messages fetched", chatService.getMessagesByRoomId(roomId)));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(@PathVariable Long messageId) {
        chatService.deleteMessage(messageId);
        return ResponseEntity.ok(ApiResponse.ok("Message deleted", null));
    }
}
