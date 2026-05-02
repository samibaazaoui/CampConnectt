package com.camp.backend.repository;

import com.camp.backend.entity.Reservation;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    
    List<Reservation> findByUserId(Long userId);
    
    @Query("SELECT r FROM Reservation r WHERE r.campsite.id = :campsiteId " +
           "AND r.status = 'CONFIRMED' " +
           "AND (:startDate < r.endDate AND :endDate > r.startDate)")
    List<Reservation> findOverlappingReservations(
            @Param("campsiteId") Long campsiteId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
