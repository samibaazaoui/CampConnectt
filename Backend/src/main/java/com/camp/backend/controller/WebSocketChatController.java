package com.camp.backend.controller;

import com.camp.backend.dto.ChatMessageResponse;
import com.camp.backend.dto.CreateChatMessageRequest;
import com.camp.backend.dto.WebSocketChatMessage;
import com.camp.backend.service.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketChatController {

    private final ChatService chatService;

    public WebSocketChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @MessageMapping("/chat/room/{roomId}/send")
    @SendTo("/topic/chat/room/{roomId}")
    public WebSocketChatMessage sendMessage(
            @DestinationVariable Long roomId,
            CreateChatMessageRequest request) {
        
        ChatMessageResponse savedMessage = chatService.sendMessage(request);
        
        return new WebSocketChatMessage(
            savedMessage.id(),
            savedMessage.roomId(),
            savedMessage.senderId(),
            savedMessage.senderName(),
            savedMessage.content(),
            savedMessage.isIncognito(),
            savedMessage.sentAt(),
            "MESSAGE",
            savedMessage.messageType(),
            savedMessage.audioUrl()
        );
    }

    @MessageMapping("/chat/room/{roomId}/typing")
    @SendTo("/topic/chat/room/{roomId}/typing")
    public WebSocketChatMessage typingIndicator(
            @DestinationVariable Long roomId,
            WebSocketChatMessage typingMessage) {
        return typingMessage;
    }

    /**
     * WebRTC Video Call Signaling: Relay offer to room participants
     */
    @MessageMapping("/chat/room/{roomId}/video-offer")
    @SendTo("/topic/chat/room/{roomId}/video-offer")
    public java.util.Map<String, Object> relayVideoOffer(
            @DestinationVariable Long roomId,
            java.util.Map<String, Object> offer) {
        return offer;
    }

    /**
     * WebRTC Video Call Signaling: Relay answer to room participants
     */
    @MessageMapping("/chat/room/{roomId}/video-answer")
    @SendTo("/topic/chat/room/{roomId}/video-answer")
    public java.util.Map<String, Object> relayVideoAnswer(
            @DestinationVariable Long roomId,
            java.util.Map<String, Object> answer) {
        return answer;
    }

    /**
     * WebRTC Video Call Signaling: Relay ICE candidates
     */
    @MessageMapping("/chat/room/{roomId}/ice-candidate")
    @SendTo("/topic/chat/room/{roomId}/ice-candidate")
    public java.util.Map<String, Object> relayIceCandidate(
            @DestinationVariable Long roomId,
            java.util.Map<String, Object> candidate) {
        return candidate;
    }

    /**
     * WebRTC: Notify when a call starts/ends
     */
    @MessageMapping("/chat/room/{roomId}/call-status")
    @SendTo("/topic/chat/room/{roomId}/call-status")
    public java.util.Map<String, Object> relayCallStatus(
            @DestinationVariable Long roomId,
            java.util.Map<String, Object> status) {
        return status;
    }
}
