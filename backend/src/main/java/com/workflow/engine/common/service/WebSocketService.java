package com.workflow.engine.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyProjectUpdate(UUID projectId, String eventType, Object payload) {
        // Send to /topic/project.{projectId}
        String destination = "/topic/project." + projectId;
        sendMessage(destination, eventType, payload);
    }

    public void notifyUser(String userId, Object payload) {
        // Send to /topic/user.{userId}
        String destination = "/topic/user." + userId;
        sendMessage(destination, "NOTIFICATION", payload);
    }

    private void sendMessage(String destination, String eventType, Object payload) {
        messagingTemplate.convertAndSend(destination, Map.of(
                "type", eventType,
                "payload", payload,
                "timestamp", System.currentTimeMillis()));
    }
}
