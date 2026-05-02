package com.camp.backend.repository;

import com.camp.backend.dto.EquipmentStatsProjection;
import com.camp.backend.entity.EquipmentOrderItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface EquipmentOrderItemRepository extends JpaRepository<EquipmentOrderItem, Long> {
    List<EquipmentOrderItem> findByOrderId(Long orderId);
    @Query("""
    SELECT
        e.id as equipmentId,
        e.name as equipmentName,
        SUM(i.quantity) as totalQuantity,
        SUM(i.quantity * i.unitPrice) as totalRevenue,
        COUNT(DISTINCT o.user.id) as totalUsers
    FROM EquipmentOrderItem i
    JOIN i.equipment e
    JOIN i.order o
    WHERE o.status = com.camp.backend.entity.EquipmentOrderStatus.APPROVED
    GROUP BY e.id, e.name
    ORDER BY SUM(i.quantity) DESC, SUM(i.quantity * i.unitPrice) DESC
""")
    List<EquipmentStatsProjection> getApprovedEquipmentStats();
}
