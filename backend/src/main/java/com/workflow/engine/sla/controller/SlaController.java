package com.workflow.engine.sla.controller;

import com.workflow.engine.sla.dto.SlaPolicyRequest;
import com.workflow.engine.sla.dto.SlaPolicyResponse;
import com.workflow.engine.sla.service.SlaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/sla-policies")
@RequiredArgsConstructor
public class SlaController {

    private final SlaService slaService;

    @GetMapping
    public List<SlaPolicyResponse> getProjectPolicies(@PathVariable UUID projectId) {
        return slaService.getProjectPolicies(projectId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SlaPolicyResponse createPolicy(
            @PathVariable UUID projectId,
            @Valid @RequestBody SlaPolicyRequest request) {
        // Ensure projectId in path matches body or set it
        request.setProjectId(projectId);
        return slaService.createPolicy(request);
    }

    @PutMapping("/{id}")
    public SlaPolicyResponse updatePolicy(
            @PathVariable UUID projectId,
            @PathVariable UUID id,
            @Valid @RequestBody SlaPolicyRequest request) {
        return slaService.updatePolicy(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePolicy(
            @PathVariable UUID projectId,
            @PathVariable UUID id) {
        slaService.deletePolicy(id);
    }
}
