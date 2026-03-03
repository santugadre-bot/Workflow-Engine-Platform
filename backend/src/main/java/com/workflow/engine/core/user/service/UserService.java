package com.workflow.engine.core.user.service;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.core.user.dto.ChangePasswordRequest;
import com.workflow.engine.core.user.dto.UpdateUserRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User getById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public User updateProfile(UUID userId, UpdateUserRequest request) {
        User user = getById(userId);

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }

        // In a real app, we would validate the URL or handle file uploads separately
        if (request.getAvatarUrl() != null) {
            // user.setAvatarUrl(request.getAvatarUrl());
            // Saving avatar URL to user entity if field exists, otherwise skipping for now
            // Assuming User entity might need an update if avatarUrl is missing
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = getById(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid current password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public String uploadAvatar(UUID userId, org.springframework.web.multipart.MultipartFile file) {
        User user = getById(userId);

        if (file.isEmpty()) {
            throw new RuntimeException("Failed to store empty file.");
        }

        try {
            String uploadDir = "uploads/avatars";
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);

            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = org.springframework.util.StringUtils.cleanPath(file.getOriginalFilename());
            String extension = "";
            int i = originalFilename.lastIndexOf('.');
            if (i > 0) {
                extension = originalFilename.substring(i);
            }
            String filename = userId.toString() + "-" + System.currentTimeMillis() + extension;

            java.nio.file.Path filePath = uploadPath.resolve(filename);

            // Copy file to the target location (Replacing existing file with the same name)
            java.nio.file.Files.copy(file.getInputStream(), filePath,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            // Update user avatar URL (Relative path for frontend)
            String avatarUrl = "/uploads/avatars/" + filename;
            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            return avatarUrl;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store file " + file.getOriginalFilename(), e);
        }
    }

    @Transactional
    public void deleteAvatar(UUID userId) {
        User user = getById(userId);
        user.setAvatarUrl(null);
        userRepository.save(user);
        // Optional: Delete physical file if needed, but keeping it simple for now or
        // manual cleanup
    }
}
