package com.workflow.engine.agile.repository;

import com.workflow.engine.agile.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoardRepository extends JpaRepository<Board, UUID> {
    List<Board> findByProjectId(UUID projectId);

    Optional<Board> findByProjectIdAndName(UUID projectId, String name);
}
