package com.camp.backend.repository;

import com.camp.backend.entity.EquipmentOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EquipmentOrderRepository extends JpaRepository<EquipmentOrder, Long> {
    List<EquipmentOrder> findByUserId(Long userId);
}
