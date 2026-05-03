package com.camp.backend.repository;

import com.camp.backend.entity.EquipmentOrderItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipmentOrderItemRepository extends JpaRepository<EquipmentOrderItem, Long> {
    List<EquipmentOrderItem> findByOrderId(Long orderId);
}
