package com.workflow.engine.automation.repository;

import com.workflow.engine.automation.entity.AutomationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AutomationRuleRepository extends JpaRepository<AutomationRule, UUID> {
    List<AutomationRule> findByProjectIdAndTriggerEventAndActiveTrue(UUID projectId, String triggerEvent);
}
