package com.camp.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "score_history")
public class ScoreHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private Integer oldScore;

    private Integer newScore;

    private Integer changeAmount;

    private String reason;

    private LocalDateTime createdAt = LocalDateTime.now();

    public ScoreHistory() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getOldScore() { return oldScore; }
    public void setOldScore(Integer oldScore) { this.oldScore = oldScore; }
    public Integer getNewScore() { return newScore; }
    public void setNewScore(Integer newScore) { this.newScore = newScore; }
    public Integer getChangeAmount() { return changeAmount; }
    public void setChangeAmount(Integer changeAmount) { this.changeAmount = changeAmount; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
