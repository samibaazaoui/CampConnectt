package com.camp.backend.repository;

import com.camp.backend.entity.ApprovalStatus;
import com.camp.backend.entity.Campsite;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CampsiteRepository extends JpaRepository<Campsite, Long> {
    List<Campsite> findByApprovalStatus(ApprovalStatus status);
    Page<Campsite> findByApprovalStatus(ApprovalStatus status, Pageable pageable);

    @Query("SELECT c FROM Campsite c WHERE c.owner.id = :ownerId")
    List<Campsite> findByOwnerId(@Param("ownerId") Long ownerId);
}
