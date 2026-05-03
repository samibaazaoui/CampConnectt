package com.camp.backend.dto;

import com.camp.backend.entity.ReservationStatus;
import java.time.LocalDate;

public record ReservationResponse(
    Long id,
    Long userId,
    String userFullName,
    Long campsiteId,
    String campsiteName,
    String location,
    LocalDate startDate,
    LocalDate endDate,
    ReservationStatus status
) {
}
