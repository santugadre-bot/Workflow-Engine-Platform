package com.workflow.engine.sla.service;

import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.sla.dto.SlaPolicyRequest;
import com.workflow.engine.sla.dto.SlaPolicyResponse;
import com.workflow.engine.sla.entity.SlaPolicy;
import com.workflow.engine.sla.repository.SlaPolicyRepository;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlaService {

    private final SlaPolicyRepository slaPolicyRepository;
    private final WorkflowStateRepository stateRepository;

    public List<SlaPolicyResponse> getProjectPolicies(UUID projectId) {
        return slaPolicyRepository.findByProjectId(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SlaPolicyResponse getPolicy(UUID id) {
        return slaPolicyRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("SLA Policy", "id", id));
    }

    @Transactional
    public SlaPolicyResponse createPolicy(SlaPolicyRequest request) {
        SlaPolicy policy = SlaPolicy.builder()
                .projectId(request.getProjectId())
                .organizationId(request.getOrganizationId())
                .name(request.getName())
                .description(request.getDescription())
                .stateId(request.getStateId())
                .priority(request.getPriority())
                .durationHours(request.getDurationHours())
                .actionType(request.getActionType())
                .build();

        return toResponse(slaPolicyRepository.save(policy));
    }

    @Transactional
    public SlaPolicyResponse updatePolicy(UUID id, SlaPolicyRequest request) {
        SlaPolicy policy = slaPolicyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SLA Policy", "id", id));

        policy.setName(request.getName());
        policy.setDescription(request.getDescription());
        policy.setStateId(request.getStateId());
        policy.setPriority(request.getPriority());
        policy.setDurationHours(request.getDurationHours());
        policy.setActionType(request.getActionType());

        return toResponse(slaPolicyRepository.save(policy));
    }

    @Transactional
    public void deletePolicy(UUID id) {
        if (!slaPolicyRepository.existsById(id)) {
            throw new ResourceNotFoundException("SLA Policy", "id", id);
        }
        slaPolicyRepository.deleteById(id);
    }

    private SlaPolicyResponse toResponse(SlaPolicy policy) {
        String stateName = "Any State";
        if (policy.getStateId() != null) {
            stateName = stateRepository.findById(policy.getStateId())
                    .map(state -> state.getName())
                    .orElse("Unknown State");
        }

        return SlaPolicyResponse.builder()
                .id(policy.getId())
                .projectId(policy.getProjectId())
                .organizationId(policy.getOrganizationId())
                .name(policy.getName())
                .description(policy.getDescription())
                .stateId(policy.getStateId())
                .stateName(stateName)
                .priority(policy.getPriority())
                .durationHours(policy.getDurationHours())
                .actionType(policy.getActionType())
                .createdAt(policy.getCreatedAt())
                .updatedAt(policy.getUpdatedAt())
                .build();
    }
}
