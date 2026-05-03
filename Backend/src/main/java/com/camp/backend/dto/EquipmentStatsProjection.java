package com.camp.backend.dto;

public interface EquipmentStatsProjection {
    Long getEquipmentId();
    String getEquipmentName();
    Double getTotalQuantity();
    Double getTotalRevenue();
    Long getTotalUsers();
}