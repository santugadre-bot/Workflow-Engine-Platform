package com.workflow.engine.auth.service;

import com.workflow.engine.auth.dto.LoginRequest;
import com.workflow.engine.auth.entity.SystemRole;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.RefreshTokenRepository;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.auth.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        // Inject check for refresh token expiration ms
        ReflectionTestUtils.setField(authService, "refreshTokenExpirationMs", 604800000L);
    }

    @Test
    void login_Success() {
        String email = "test@example.com";
        String password = "password";
        String encodedPassword = "encodedPassword";
        UUID userId = UUID.randomUUID();

        User user = User.builder()
                .email(email)
                .password(encodedPassword)
                .displayName("Test User")
                .active(true)
                .systemRole(SystemRole.USER)
                .build();
        user.setId(userId);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(password, encodedPassword)).thenReturn(true);
        when(jwtProvider.generateAccessToken(userId, email, SystemRole.USER)).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);

        var response = authService.login(request);

        assertNotNull(response);
        assertEquals(email, response.getEmail());
        assertEquals("access-token", response.getAccessToken());
    }
}
