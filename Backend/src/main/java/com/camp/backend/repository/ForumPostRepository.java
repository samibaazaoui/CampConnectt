package com.camp.backend.repository;

import com.camp.backend.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
}
