package com.workflow.engine.notification.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_user", columnList = "user_id"),
        @Index(name = "idx_notification_organization", columnList = "organization_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String type; // e.g., TASK_ASSIGNED, TASK_TRANSITIONED

    private UUID referenceId; // e.g., taskId

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "is_read", nullable = false)
    private boolean read;

}
