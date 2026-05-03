package com.camp.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateReservationRequest(
    @NotNull Long userId,
    @NotNull Long campsiteId,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate
) {
}
