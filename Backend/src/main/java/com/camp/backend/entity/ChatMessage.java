package com.camp.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    private String content;

    private boolean isIncognito = false;

    private String pseudonym;

    @Enumerated(EnumType.STRING)
    private ChatMessageType messageType = ChatMessageType.TEXT;

    private String audioUrl;

    private LocalDateTime sentAt = LocalDateTime.now();

    public ChatMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ChatRoom getRoom() { return room; }
    public void setRoom(ChatRoom room) { this.room = room; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public boolean isIncognito() { return isIncognito; }
    public void setIncognito(boolean incognito) { isIncognito = incognito; }
    public String getPseudonym() { return pseudonym; }
    public void setPseudonym(String pseudonym) { this.pseudonym = pseudonym; }
    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public ChatMessageType getMessageType() { return messageType; }
    public void setMessageType(ChatMessageType messageType) { this.messageType = messageType; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
}
