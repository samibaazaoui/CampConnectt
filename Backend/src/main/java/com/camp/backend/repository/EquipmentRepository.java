package com.camp.backend.repository;

import com.camp.backend.entity.ApprovalStatus;
import com.camp.backend.entity.Equipment;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    @Modifying
    @Query("UPDATE Equipment e SET e.quantityInStock = e.quantityInStock - :quantity " +
           "WHERE e.id = :id AND e.quantityInStock >= :quantity")
    int deductStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    List<Equipment> findByApprovalStatus(ApprovalStatus status);
    Page<Equipment> findByApprovalStatus(ApprovalStatus status, Pageable pageable);
    List<Equipment> findByOwnerId(Long ownerId);
}
