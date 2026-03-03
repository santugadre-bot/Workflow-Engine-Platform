package com.workflow.engine.agile.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "boards", indexes = {
        @Index(name = "idx_board_project", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Board extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BoardType type;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    /**
     * JSON configuration for columns.
     * Example:
     * [
     * { "name": "To Do", "statusIds": ["uuid1", "uuid2"] },
     * { "name": "In Progress", "statusIds": ["uuid3"] },
     * { "name": "Done", "statusIds": ["uuid4"] }
     * ]
     */
    @Column(name = "columns_config", columnDefinition = "TEXT")
    private String columnsConfig;
}
