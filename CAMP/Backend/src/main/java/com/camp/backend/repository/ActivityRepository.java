package com.camp.backend.repository;

import com.camp.backend.entity.Activity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByEventId(Long eventId);
}
