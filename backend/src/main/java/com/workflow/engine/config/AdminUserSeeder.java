
package com.workflow.engine.config;

import com.workflow.engine.auth.entity.SystemRole;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminUserSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserSeeder(UserRepository userRepository, @Lazy PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public CommandLineRunner createSuperAdmin() {
        return args -> {
            String adminEmail = "admin@workflow.com";
            if (!userRepository.existsByEmail(adminEmail)) {
                User admin = User.builder()
                        .email(adminEmail)
                        .displayName("Super Admin")
                        .password(passwordEncoder.encode("admin123"))
                        .systemRole(SystemRole.SUPER_ADMIN)
                        .active(true)
                        .build();
                userRepository.save(admin);
                System.out.println("----------------------------------------------------------");
                System.out.println("SUPER ADMIN CREATED: " + adminEmail + " / admin123");
                System.out.println("----------------------------------------------------------");
            } else {
                // Ensure existing admin has SUPER_ADMIN role if somehow demoted
                userRepository.findByEmail(adminEmail).ifPresent(user -> {
                    if (user.getSystemRole() != SystemRole.SUPER_ADMIN) {
                        user.setSystemRole(SystemRole.SUPER_ADMIN);
                        userRepository.save(user);
                        System.out.println("UPDATED EXISTING ADMIN TO SUPER_ADMIN ROLE");
                    }
                });
            }
        };
    }
}
