package com.workflow.engine.task.service;

import com.workflow.engine.common.exception.AccessDeniedException;
import com.workflow.engine.common.exception.BusinessException;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.entity.TaskAttachment;
import com.workflow.engine.task.repository.TaskAttachmentRepository;
import com.workflow.engine.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskAttachmentService {

    private final TaskAttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final ProjectPermissionService projectPermissionService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional
    public TaskAttachment upload(UUID taskId, MultipartFile file, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        projectPermissionService.checkPermission(userId, task.getProjectId(),
                com.workflow.engine.rbac.entity.ProjectPermission.EDIT_ISSUE);

        if (file.isEmpty())
            throw new BusinessException("File is empty");
        if (file.getSize() > 25 * 1024 * 1024)
            throw new BusinessException("File exceeds 25 MB limit");

        try {
            Path dir = Paths.get(uploadDir, "attachments", taskId.toString());
            Files.createDirectories(dir);

            String originalName = file.getOriginalFilename() != null
                    ? file.getOriginalFilename()
                    : "file";
            String storedName = UUID.randomUUID() + "_" + originalName;
            Path dest = dir.resolve(storedName);
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            TaskAttachment attachment = TaskAttachment.builder()
                    .taskId(taskId)
                    .uploadedById(userId)
                    .fileName(originalName)
                    .fileUrl("attachments/" + taskId + "/" + storedName)
                    .mimeType(file.getContentType())
                    .fileSizeBytes(file.getSize())
                    .build();
            return attachmentRepository.save(attachment);

        } catch (IOException e) {
            log.error("Failed to store attachment for task {}: {}", taskId, e.getMessage());
            throw new BusinessException("Failed to store file: " + e.getMessage());
        }
    }

    public List<TaskAttachment> list(UUID taskId, UUID userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
        projectPermissionService.checkPermission(userId, task.getProjectId(),
                com.workflow.engine.rbac.entity.ProjectPermission.BROWSE_PROJECT);
        return attachmentRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
    }

    @Transactional
    public void delete(UUID attachmentId, UUID userId) {
        TaskAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));

        // Only uploader can delete
        if (!attachment.getUploadedById().equals(userId)) {
            throw new AccessDeniedException("You can only delete your own attachments");
        }

        // Delete file from disk
        try {
            Path file = Paths.get(uploadDir, attachment.getFileUrl());
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", attachment.getFileUrl(), e.getMessage());
        }

        attachmentRepository.delete(attachment);
    }

    public Resource download(UUID attachmentId, UUID userId) {
        TaskAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));

        Task task = taskRepository.findById(attachment.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", attachment.getTaskId()));
        projectPermissionService.checkPermission(userId, task.getProjectId(),
                com.workflow.engine.rbac.entity.ProjectPermission.BROWSE_PROJECT);

        try {
            Path file = Paths.get(uploadDir, attachment.getFileUrl());
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists())
                throw new ResourceNotFoundException("File", "path", attachment.getFileUrl());
            return resource;
        } catch (MalformedURLException e) {
            throw new BusinessException("Could not read file: " + e.getMessage());
        }
    }

    public TaskAttachment findById(UUID attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", attachmentId));
    }

    public long countByTask(UUID taskId) {
        return attachmentRepository.countByTaskId(taskId);
    }
}
