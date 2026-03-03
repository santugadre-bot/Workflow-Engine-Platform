package com.workflow.engine.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.engine.auth.dto.LoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ObjectMapper objectMapper;

        @Test
        void login_ShouldReturn200_WhenCredentialsAreValid() throws Exception {
                // 1. Register a user
                String email = "integration" + System.currentTimeMillis() + "@example.com";
                String password = "password123";

                String registerJson = String
                                .format("{\"email\":\"%s\",\"password\":\"%s\",\"displayName\":\"Integration Test\"}",
                                                email, password);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(registerJson))
                                .andExpect(status().isCreated());

                // 2. Login with that user
                LoginRequest loginRequest = new LoginRequest();
                loginRequest.setEmail(email);
                loginRequest.setPassword(password);

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(result -> {
                                        if (result.getResponse().getStatus() == 500) {
                                                throw new RuntimeException("500 Error: " +
                                                                (result.getResolvedException() != null
                                                                                ? result.getResolvedException()
                                                                                                .getMessage()
                                                                                : "Unknown"));
                                        }
                                })
                                .andExpect(status().isOk());
        }
}
