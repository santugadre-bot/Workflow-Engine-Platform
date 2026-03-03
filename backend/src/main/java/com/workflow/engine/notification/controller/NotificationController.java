package com.workflow.engine.notification.controller;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.notification.dto.NotificationResponse;
import com.workflow.engine.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list(@AuthenticationPrincipal User user) {
        return notificationService.getUserNotifications(user.getId());
    }

    @GetMapping("/unread-count")
    public long unreadCount(@AuthenticationPrincipal User user) {
        return notificationService.getUnreadCount(user.getId());
    }

    @PostMapping("/{id}/read")
    public void markRead(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        notificationService.markAsRead(id, user.getId());
    }

    @PostMapping("/read-all")
    public void markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
    }
}
