package com.camp.backend.repository;

import com.camp.backend.entity.EquipmentOrder;

import java.time.LocalDateTime;
import java.util.List;

import com.camp.backend.entity.EquipmentOrderStatus;
import com.camp.backend.entity.User;
import com.camp.backend.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EquipmentOrderRepository extends JpaRepository<EquipmentOrder, Long> {
    List<EquipmentOrder> findByUserId(Long userId);
    @Query("SELECT o FROM EquipmentOrder o JOIN o.user u  WHERE u.fullName = :name")
    List<EquipmentOrder> findOrdersByUserName(@Param("name") String name);
    List<EquipmentOrder> findByUser_RoleAndStatus(
            UserRole role,
            EquipmentOrderStatus status
    );
    @Query("""
    SELECT DISTINCT o.user 
    FROM EquipmentOrder o
    JOIN EquipmentOrderItem i ON i.order.id = o.id
    JOIN Equipment e ON i.equipment.id = e.id
    WHERE e.owner.id = :ownerId
""")
    List<User> findUsersWhoOrderedMyEquipment(@Param("ownerId") Long ownerId);



}

