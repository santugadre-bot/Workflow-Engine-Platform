package com.workflow.engine.agile.repository;

import com.workflow.engine.agile.entity.Sprint;
import com.workflow.engine.agile.entity.SprintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SprintRepository extends JpaRepository<Sprint, UUID> {

        List<Sprint> findByProjectId(UUID projectId);

        List<Sprint> findByProjectIdAndStatus(UUID projectId, SprintStatus status);

        @Query("SELECT s FROM Sprint s WHERE s.projectId = :projectId AND s.status IN :statuses ORDER BY s.startDate ASC")
        List<Sprint> findByProjectIdAndStatusIn(@Param("projectId") UUID projectId,
                        @Param("statuses") List<SprintStatus> statuses);

        Optional<Sprint> findFirstByProjectIdAndStatus(UUID projectId, SprintStatus status); // For finding single
                                                                                             // ACTIVE sprint
                                                                                             // per project
}
