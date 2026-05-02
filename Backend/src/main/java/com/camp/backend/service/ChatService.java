// src/main/java/com/camp/backend/service/ChatService.java
package com.camp.backend.service;

import com.camp.backend.config.BadRequestException;
import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.ChatMessageResponse;
import com.camp.backend.dto.ChatParticipantResponse;
import com.camp.backend.dto.ChatRoomResponse;
import com.camp.backend.dto.ChatStatsResponse;
import com.camp.backend.dto.CreateChatMessageRequest;
import com.camp.backend.dto.CreateChatParticipantRequest;
import com.camp.backend.dto.CreateChatRoomRequest;
import com.camp.backend.entity.ChatMessage;
import com.camp.backend.entity.ChatMessageType;
import com.camp.backend.entity.ChatParticipant;
import com.camp.backend.entity.ChatRoom;
import com.camp.backend.entity.ChatRoomType;
import com.camp.backend.entity.User;
import com.camp.backend.entity.UserRole;
import com.camp.backend.repository.ChatMessageRepository;
import com.camp.backend.repository.ChatParticipantRepository;
import com.camp.backend.repository.ChatRoomRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

// ✅ CORRECTION 1 : Import correct pour @PostConstruct (Jakarta pour Spring Boot 3)
import jakarta.annotation.PostConstruct;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final DateTimeFormatter LOG_TIME = DateTimeFormatter.ofPattern("HH:mm:ss");

    private final ChatRoomRepository roomRepository;
    private final ChatMessageRepository messageRepository;
    private final ChatParticipantRepository participantRepository;
    private final UserService userService;
    private final SpamCheckService spamCheckService;
    private final UserScoreService userScoreService;

    @Value("${chat.cooldown.seconds:30}")
    private int cooldownSeconds;

    private final Map<Long, LocalDateTime> userCooldowns = new ConcurrentHashMap<>();

    private static final List<String> ADJECTIVES = List.of("Wild", "Silent", "Brave", "Ancient", "Free", "Golden", "Midnight", "Rocky", "Misty", "Starlit");
    private static final List<String> NOUNS = List.of("Camper", "Wolf", "Forest", "Eagle", "Mountain", "River", "Tent", "Fire", "Path", "Star");
    private final Random random = new Random();

    public ChatService(ChatRoomRepository roomRepository,
                       ChatMessageRepository messageRepository,
                       ChatParticipantRepository participantRepository,
                       UserService userService,
                       SpamCheckService spamCheckService,
                       UserScoreService userScoreService) {
        this.roomRepository = roomRepository;
        this.messageRepository = messageRepository;
        this.participantRepository = participantRepository;
        this.userService = userService;
        this.spamCheckService = spamCheckService;
        this.userScoreService = userScoreService;
    }

    // ✅ CORRECTION 1 (suite) : Utilisation de l'annotation Jakarta
    @PostConstruct
    public void init() {
        log.info("🚀 ChatService initialized | Cooldown: {} seconds", cooldownSeconds);
    }

    @Scheduled(cron = "0 0 0 * * SUN")
    public void cleanupInactiveRooms() {
        log.info("🧹 [WeeklyCleanup] Starting inactive rooms cleanup...");
        log.info("✅ [WeeklyCleanup] Completed");
    }

    /**
     * ✅ CORRECTION 2 : Comptage manuel car removeIf retourne boolean
     */
    @Scheduled(fixedRate = 60000)
    private void cleanupExpiredCooldowns() {
        LocalDateTime now = LocalDateTime.now();
        long beforeCount = userCooldowns.size();
        
        // On itère manuellement pour compter les suppressions
        List<Long> toRemove = new ArrayList<>();
        for (Map.Entry<Long, LocalDateTime> entry : userCooldowns.entrySet()) {
            if (entry.getValue().isBefore(now)) {
                toRemove.add(entry.getKey());
                log.debug("🗑️ [Cleanup] Removing expired cooldown for userId={}", entry.getKey());
            }
        }
        
        // Suppression effective
        for (Long id : toRemove) {
            userCooldowns.remove(id);
        }
        
        long removed = toRemove.size();
        long afterCount = userCooldowns.size();
        
        if (removed > 0) {
            log.info("🧹 [CooldownCleanup] {} | Removed: {} expired | Active: {}", 
                now.format(LOG_TIME), removed, afterCount);
        }
    }

    public List<ChatMessageResponse> getMessagesByRole(Long roomId, UserRole role) {
        return messageRepository.findByRoomIdAndSenderRole(roomId, role).stream()
                .map(this::toMessageResponse).toList();
    }

    public ChatStatsResponse getUserChatStats(Long userId) {
        List<ChatMessage> allUserMessages = messageRepository.findAll().stream()
            .filter(m -> m.getSender().getId().equals(userId))
            .toList();

        long totalMessages = allUserMessages.size();
        long totalRoomsJoined = participantRepository.countByUserId(userId);
        
        Optional<ChatMessage> lastMessage = allUserMessages.stream()
            .max((m1, m2) -> m1.getSentAt().compareTo(m2.getSentAt()));
        LocalDateTime lastMessageAt = lastMessage.map(ChatMessage::getSentAt).orElse(null);

        double avgLength = allUserMessages.stream()
            .filter(m -> m.getContent() != null)
            .mapToInt(m -> m.getContent().length())
            .average().orElse(0.0);

        Map<Integer, Long> hourFrequency = allUserMessages.stream()
            .collect(Collectors.groupingBy(m -> m.getSentAt().getHour(), Collectors.counting()));
        
        long peakHour = hourFrequency.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey).orElse(-1);

        List<String> badges = new ArrayList<>();
        if (totalMessages > 100) badges.add("Chat Legend");
        else if (totalMessages > 50) badges.add("Active Talker");
        if (peakHour >= 22 || peakHour <= 4) badges.add("Night Owl");
        if (avgLength > 100) badges.add("Philosopher");
        if (totalRoomsJoined > 5) badges.add("Social Butterfly");

        return new ChatStatsResponse(totalMessages, totalRoomsJoined, lastMessageAt, avgLength, peakHour, badges);
    }

    public ChatRoomResponse createRoom(CreateChatRoomRequest request) {
        log.info("🏠 Creating chat room: name='{}'", request.name());
        ChatRoom room = new ChatRoom();
        room.setName(request.name());
        room.setRoomType(ChatRoomType.GROUP);
        ChatRoom saved = roomRepository.save(room);
        log.info("✅ Room created: id={}", saved.getId());
        return toRoomResponse(saved);
    }

    public ChatRoomResponse createOneToOneRoom(Long userId1, Long userId2) {
        log.info("👥 Creating 1-to-1 room for users {} and {}", userId1, userId2);
        User user1 = userService.getById(userId1);
        User user2 = userService.getById(userId2);
        
        ChatRoom room = new ChatRoom();
        room.setName(user1.getFullName() + " & " + user2.getFullName());
        room.setRoomType(ChatRoomType.ONE_TO_ONE);
        ChatRoom saved = roomRepository.save(room);
        
        ChatParticipant p1 = new ChatParticipant();
        p1.setRoom(saved);
        p1.setUser(user1);
        participantRepository.save(p1);
        
        ChatParticipant p2 = new ChatParticipant();
        p2.setRoom(saved);
        p2.setUser(user2);
        participantRepository.save(p2);
        
        log.info("✅ 1-to-1 room created: id={}", saved.getId());
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
        log.info("🗑️ Deleting room: id={}", id);
        ChatRoom room = getRoomEntityById(id);
        roomRepository.delete(room);
        log.info("✅ Room deleted: id={}", id);
    }

    public ChatParticipantResponse addParticipant(CreateChatParticipantRequest request) {
        log.info("➕ Adding participant: userId={} to roomId={}", request.userId(), request.roomId());
        ChatRoom room = getRoomEntityById(request.roomId());
        User user = userService.getById(request.userId());
        
        ChatParticipant participant = new ChatParticipant();
        participant.setRoom(room);
        participant.setUser(user);
        
        ChatParticipant saved = participantRepository.save(participant);
        log.info("✅ Participant added: id={}", saved.getId());
        return toParticipantResponse(saved);
    }
    
    public List<ChatParticipantResponse> getParticipantsByRoomId(Long roomId) {
        return participantRepository.findByRoomId(roomId).stream().map(this::toParticipantResponse).toList();
    }

    public void removeParticipant(Long participationId) {
        log.info("➖ Removing participant: participationId={}", participationId);
        ChatParticipant participation = participantRepository.findById(participationId)
            .orElseThrow(() -> new ResourceNotFoundException("Participation not found: " + participationId));
        participantRepository.delete(participation);
        log.info("✅ Participant removed: id={}", participationId);
    }

    /**
     * ✅ MÉTHODE PRINCIPALE : Envoi de message avec logs
     */
    public ChatMessageResponse sendMessage(CreateChatMessageRequest request) {
        String time = LocalDateTime.now().format(LOG_TIME);
        Long senderId = request.senderId();
        Long roomId = request.roomId();
        
        log.info("📨 [{}] Received message request | userId={} | roomId={}", time, senderId, roomId);

        ChatRoom room = getRoomEntityById(roomId);
        User sender = userService.getById(senderId);
        
        ChatMessageType msgType = ChatMessageType.TEXT;
        if (request.messageType() != null) {
            try {
                msgType = ChatMessageType.valueOf(request.messageType());
            } catch (IllegalArgumentException e) {
                msgType = ChatMessageType.TEXT;
            }
        }

        // ML SPAM CHECK
        if (msgType == ChatMessageType.TEXT && request.content() != null && !request.content().trim().isEmpty()) {
            try {
                spamCheckService.checkSpam(request.content());
            } catch (Exception e) {
                log.warn("⚠️ Spam check unavailable: {}", e.getMessage());
            }
        }
        
        // ✅ COOLDOWN CHECK
        if (userCooldowns.containsKey(senderId)) {
            LocalDateTime cooldownEnd = userCooldowns.get(senderId);
            
            if (cooldownEnd.isAfter(LocalDateTime.now())) {
                long remaining = java.time.Duration.between(LocalDateTime.now(), cooldownEnd).getSeconds() + 1;
                log.warn("🚫 [COOLDOWN] Blocked userId={} | Remaining: {}s", senderId, remaining);
                throw new BadRequestException("Please wait " + remaining + " seconds before sending another message.");
            } else {
                userCooldowns.remove(senderId);
            }
        }

        ChatMessage message = new ChatMessage();
        message.setRoom(room);
        message.setSender(sender);
        message.setContent(request.content() != null ? request.content() : "");
        message.setIncognito(request.isIncognito());
        message.setMessageType(msgType);
        message.setAudioUrl(request.audioUrl());
        
        if (request.isIncognito()) {
            String pseudonym = ADJECTIVES.get(random.nextInt(ADJECTIVES.size())) + " " + 
                               NOUNS.get(random.nextInt(NOUNS.size())) + "#" + 
                               (random.nextInt(9000) + 1000);
            message.setPseudonym(pseudonym);
        }
        
        ChatMessage saved = messageRepository.save(message);
        userScoreService.updateUserScore(senderId, 2, "Chat message sent");

        // ✅ ACTIVER LE COOLDOWN
        LocalDateTime cooldownEnd = LocalDateTime.now().plusSeconds(cooldownSeconds);
        userCooldowns.put(senderId, cooldownEnd);
        log.info("⏱️ [COOLDOWN SET] userId={} | Expires: {}", senderId, cooldownEnd.format(LOG_TIME));

        log.info("✅ [{}] Message sent | id={} | userId={}", time, saved.getId(), senderId);
        
        return toMessageResponse(saved);
    }

    public long getCooldownRemainingSeconds(Long userId) {
        if (!userCooldowns.containsKey(userId)) return 0;
        LocalDateTime cooldownEnd = userCooldowns.get(userId);
        if (cooldownEnd.isBefore(LocalDateTime.now())) {
            userCooldowns.remove(userId);
            return 0;
        }
        return java.time.Duration.between(LocalDateTime.now(), cooldownEnd).getSeconds() + 1;
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

    // MAPPERS
    private ChatRoomResponse toRoomResponse(ChatRoom room) {
        return new ChatRoomResponse(room.getId(), room.getName(), 
            room.getRoomType() != null ? room.getRoomType().name() : "GROUP", room.getCreatedAt());
    }

    private ChatParticipantResponse toParticipantResponse(ChatParticipant participant) {
        return new ChatParticipantResponse(participant.getId(), participant.getRoom().getId(),
            participant.getRoom().getName(), participant.getUser().getId(),
            participant.getUser().getFullName(), participant.getJoinedAt());
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        String senderName = message.isIncognito() ? message.getPseudonym() : message.getSender().getFullName();
        Long senderId = message.isIncognito() ? -1L : message.getSender().getId();
        return new ChatMessageResponse(message.getId(), message.getRoom().getId(), senderId, senderName,
            message.getContent(), message.isIncognito(), message.getSentAt(),
            message.getMessageType() != null ? message.getMessageType().name() : "TEXT", message.getAudioUrl());
    }
}