package com.camp.backend.repository;

import com.camp.backend.entity.ForumComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumCommentRepository extends JpaRepository<ForumComment, Long> {
    List<ForumComment> findByPostId(Long postId);
}
