package com.workflow.engine.notification.service;

import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.notification.dto.NotificationResponse;
import com.workflow.engine.notification.entity.Notification;
import com.workflow.engine.notification.repository.NotificationRepository;
import com.workflow.engine.common.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final com.workflow.engine.common.service.WebSocketService webSocketService;

    @Transactional
    public void createNotification(UUID userId, String title, String message, String type, UUID referenceId,
            UUID organizationId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .organizationId(organizationId)
                .read(false)
                .build();
        notificationRepository.save(notification);

        // Real-time broadcast
        try {
            webSocketService.notifyUser(userId.toString(), toResponse(notification));
        } catch (Exception e) {
            // Log and ignore
        }
    }

    @Transactional
    public void notifyUsers(List<UUID> userIds, String title, String message, String type, UUID referenceId,
            UUID organizationId) {
        List<Notification> notifications = userIds.stream()
                .distinct()
                .map(userId -> Notification.builder()
                        .userId(userId)
                        .title(title)
                        .message(message)
                        .type(type)
                        .referenceId(referenceId)
                        .organizationId(organizationId)
                        .read(false)
                        .build())
                .toList();
        notificationRepository.saveAll(notifications);

        // Real-time broadcast
        notifications.forEach(n -> {
            try {
                webSocketService.notifyUser(n.getUserId().toString(), toResponse(n));
            } catch (Exception e) {
                // Log and ignore
            }
        });
    }

    public List<NotificationResponse> getUserNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (notification.getUserId().equals(userId)) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId().toString())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .referenceId(n.getReferenceId() != null ? n.getReferenceId().toString() : null)
                .organizationId(n.getOrganizationId() != null ? n.getOrganizationId().toString() : null)
                .read(n.isRead())
                .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null)
                .build();
    }
}
