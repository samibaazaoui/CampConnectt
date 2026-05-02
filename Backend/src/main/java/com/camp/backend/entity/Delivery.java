package com.camp.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
public class Delivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", unique = true)
    private EquipmentOrder order;

    private String deliveryAddress;

    private String deliveryAgent;

    @Enumerated(EnumType.STRING)
    private DeliveryStatus status = DeliveryStatus.PENDING;

    private LocalDateTime scheduledAt;

    private LocalDateTime deliveredAt;

    public Delivery() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public EquipmentOrder getOrder() { return order; }
    public void setOrder(EquipmentOrder order) { this.order = order; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public String getDeliveryAgent() { return deliveryAgent; }
    public void setDeliveryAgent(String deliveryAgent) { this.deliveryAgent = deliveryAgent; }
    public DeliveryStatus getStatus() { return status; }
    public void setStatus(DeliveryStatus status) { this.status = status; }
    public LocalDateTime getScheduledAt() { return scheduledAt; }
    public void setScheduledAt(LocalDateTime scheduledAt) { this.scheduledAt = scheduledAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
}
