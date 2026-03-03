package com.workflow.engine.automation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "automation_rules")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutomationRule {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private UUID projectId;

    @Column(nullable = false)
    private String triggerEvent; // CREATED, TRANSITIONED, UPDATED

    @Column(columnDefinition = "TEXT")
    private String conditionsJson; // JSON representation of conditions

    @Column(nullable = false)
    private String actionType; // NOTIFY, UPDATE_FIELD, MOVE_STATE

    @Column(columnDefinition = "TEXT")
    private String actionConfigJson; // JSON representation of action configuration

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

}
