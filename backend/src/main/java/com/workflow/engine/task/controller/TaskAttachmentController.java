package com.workflow.engine.task.controller;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.task.entity.TaskAttachment;
import com.workflow.engine.task.service.TaskAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks/{taskId}/attachments")
@RequiredArgsConstructor
public class TaskAttachmentController {

        private final TaskAttachmentService attachmentService;

        /** POST /api/tasks/{taskId}/attachments — upload a file */
        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<Map<String, Object>> upload(
                        @PathVariable UUID taskId,
                        @RequestParam("file") MultipartFile file,
                        @AuthenticationPrincipal User user) {
                TaskAttachment saved = attachmentService.upload(taskId, file, user.getId());
                return ResponseEntity.ok(Map.of(
                                "id", saved.getId(),
                                "fileName", saved.getFileName(),
                                "fileUrl", saved.getFileUrl(),
                                "mimeType", saved.getMimeType() != null ? saved.getMimeType() : "",
                                "fileSizeBytes", saved.getFileSizeBytes() != null ? saved.getFileSizeBytes() : 0L,
                                "uploadedById", saved.getUploadedById(),
                                "createdAt", saved.getCreatedAt() != null ? saved.getCreatedAt().toString() : ""));
        }

        /** GET /api/tasks/{taskId}/attachments — list attachments */
        @GetMapping
        public ResponseEntity<List<Map<String, Object>>> list(
                        @PathVariable UUID taskId,
                        @AuthenticationPrincipal User user) {
                List<Map<String, Object>> result = attachmentService.list(taskId, user.getId()).stream()
                                .map(a -> Map.<String, Object>of(
                                                "id", a.getId(),
                                                "fileName", a.getFileName(),
                                                "fileUrl", a.getFileUrl(),
                                                "mimeType", a.getMimeType() != null ? a.getMimeType() : "",
                                                "fileSizeBytes",
                                                a.getFileSizeBytes() != null ? a.getFileSizeBytes() : 0L,
                                                "uploadedById", a.getUploadedById(),
                                                "createdAt",
                                                a.getCreatedAt() != null ? a.getCreatedAt().toString() : ""))
                                .toList();
                return ResponseEntity.ok(result);
        }

        /** GET /api/tasks/{taskId}/attachments/{attachmentId}/download */
        @GetMapping("/{attachmentId}/download")
        public ResponseEntity<Resource> download(
                        @PathVariable UUID taskId,
                        @PathVariable UUID attachmentId,
                        @AuthenticationPrincipal User user) {
                // We need the original fileName — fetch attachment metadata first
                com.workflow.engine.task.entity.TaskAttachment attachment = attachmentService.findById(attachmentId);
                Resource resource = attachmentService.download(attachmentId, user.getId());
                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=\"" + attachment.getFileName() + "\"")
                                .header(HttpHeaders.CONTENT_TYPE,
                                                attachment.getMimeType() != null ? attachment.getMimeType()
                                                                : "application/octet-stream")
                                .body(resource);
        }

        /** DELETE /api/tasks/{taskId}/attachments/{attachmentId} */
        @DeleteMapping("/{attachmentId}")
        public ResponseEntity<Void> delete(
                        @PathVariable UUID taskId,
                        @PathVariable UUID attachmentId,
                        @AuthenticationPrincipal User user) {
                attachmentService.delete(attachmentId, user.getId());
                return ResponseEntity.noContent().build();
        }
}
