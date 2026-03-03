package com.workflow.engine.auth.security;

import com.workflow.engine.auth.entity.SystemRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;
    private final String secret = "workflow-engine-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256";
    private final long expiration = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider(secret, expiration);
    }

    @Test
    void generateAccessToken_ShouldReturnToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        SystemRole role = SystemRole.USER;

        String token = jwtProvider.generateAccessToken(userId, email, role);

        assertNotNull(token);
        assertTrue(token.length() > 0);
        assertTrue(jwtProvider.validateToken(token));
        assertEquals(userId, jwtProvider.getUserIdFromToken(token));
        assertEquals(email, jwtProvider.getEmailFromToken(token));
        assertEquals(role, jwtProvider.getSystemRoleFromToken(token));
    }
}
