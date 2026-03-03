package com.workflow.engine.task.service;

import com.workflow.engine.audit.service.AuditService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.notification.service.NotificationService;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import com.workflow.engine.task.dto.AddCommentRequest;
import com.workflow.engine.task.dto.CommentResponse;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.entity.TaskComment;
import com.workflow.engine.task.repository.TaskCommentRepository;
import com.workflow.engine.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskCommentService {

        private final TaskRepository taskRepository;
        private final TaskCommentRepository commentRepository;
        private final ProjectPermissionService projectPermissionService;
        private final UserRepository userRepository;
        private final AuditService auditService;
        private final NotificationService notificationService;

        @Transactional
        public CommentResponse addComment(UUID taskId, AddCommentRequest request, UUID userId) {
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
                projectPermissionService.checkPermission(userId, task.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.COMMENT_ISSUE);

                TaskComment comment = TaskComment.builder()
                                .taskId(taskId)
                                .userId(userId)
                                .content(request.getContent())
                                .build();
                comment = commentRepository.save(comment);

                User commenter = userRepository.findById(userId).orElse(null);

                // Parse @mentions and notify mentioned users
                java.util.regex.Pattern mentionPattern = java.util.regex.Pattern.compile("@(\\w+)");
                java.util.regex.Matcher matcher = mentionPattern.matcher(request.getContent());
                while (matcher.find()) {
                        String token = matcher.group(1);
                        userRepository.findByDisplayNameContainingIgnoreCase(token).stream()
                                        .filter(mentioned -> !mentioned.getId().equals(userId)) // don't self-notify
                                        .forEach(mentioned -> {
                                                String commenterName = commenter != null ? commenter.getDisplayName()
                                                                : "Someone";
                                                notificationService.createNotification(
                                                                mentioned.getId(),
                                                                "You were mentioned",
                                                                commenterName + " mentioned you in a comment on task: "
                                                                                + task.getTitle(),
                                                                "COMMENT_MENTION",
                                                                taskId,
                                                                task.getOrganizationId());
                                        });
                }

                auditService.log(userId, "COMMENT_ADDED", "Task", taskId,
                                task.getOrganizationId(), "Added comment on task");

                return CommentResponse.builder()
                                .id(comment.getId().toString())
                                .content(comment.getContent())
                                .userId(userId.toString())
                                .userName(commenter != null ? commenter.getDisplayName() : "Unknown")
                                .createdAt(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null)
                                .build();
        }

        public List<CommentResponse> getComments(UUID taskId, UUID userId) {
                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException("Task", "id", taskId));
                projectPermissionService.checkPermission(userId, task.getProjectId(),
                                com.workflow.engine.rbac.entity.ProjectPermission.BROWSE_PROJECT);

                return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                                .map(c -> {
                                        User user = userRepository.findById(c.getUserId()).orElse(null);
                                        return CommentResponse.builder()
                                                        .id(c.getId().toString())
                                                        .content(c.getContent())
                                                        .userId(c.getUserId().toString())
                                                        .userName(user != null ? user.getDisplayName() : "Unknown")
                                                        .createdAt(c.getCreatedAt() != null
                                                                        ? c.getCreatedAt().toString()
                                                                        : null)
                                                        .build();
                                })
                                .toList();
        }

        public long getCommentCount(UUID taskId) {
                return commentRepository.countByTaskId(taskId);
        }
}
