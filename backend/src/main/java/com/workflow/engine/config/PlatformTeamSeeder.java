package com.workflow.engine.config;

import com.workflow.engine.auth.entity.SystemRole;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.organization.entity.Organization;
import com.workflow.engine.organization.repository.OrganizationRepository;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.*;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.rbac.repository.ProjectMemberRepository;
import com.workflow.engine.workflow.entity.Workflow;
import com.workflow.engine.workflow.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Seeds a full demonstration team with various Project Roles.
 * Demo users: password is "password123".
 * Super Admin: admin@workflow.com / Admin@123
 */
@Configuration
@RequiredArgsConstructor
public class PlatformTeamSeeder {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkflowRepository workflowRepository;
    private final @Lazy PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedSuperAdmin() {
        return args -> {
            userRepository.findByEmail("admin@workflow.com").ifPresentOrElse(
                    existing -> {
                        // Ensure correct role and password on every startup
                        existing.setSystemRole(SystemRole.SUPER_ADMIN);
                        existing.setPassword(passwordEncoder.encode("Admin@123"));
                        existing.setDisplayName("System Administrator");
                        existing.setActive(true);
                        userRepository.save(existing);
                        System.out.println("[SuperAdmin] admin@workflow.com updated.");
                    },
                    () -> {
                        User admin = User.builder()
                                .email("admin@workflow.com")
                                .displayName("System Administrator")
                                .password(passwordEncoder.encode("Admin@123"))
                                .systemRole(SystemRole.SUPER_ADMIN)
                                .active(true)
                                .build();
                        userRepository.save(admin);
                        System.out.println("[SuperAdmin] admin@workflow.com created as SUPER_ADMIN.");
                    });
        };
    }

    @Bean
    public CommandLineRunner seedDemoTeam() {
        return args -> {
            if (userRepository.existsByEmail("owner@workflow.com")) {
                return; // Already seeded
            }

            System.out.println("----------------------------------------------------------");
            System.out.println("SEEDING DEMO TEAM AND ROLES...");

            // 1. Create Organization Owner
            User owner = createDemoUser("owner@workflow.com", "Enterprise Owner");

            // 2. Create Organization
            Organization org = Organization.builder()
                    .name("Elite Solution Corp")
                    .description("Demo Organization for Team Testing")
                    .ownerId(owner.getId())
                    .build();
            org = organizationRepository.save(org);

            // Add Owner as Organization Member
            organizationMemberRepository.save(OrganizationMember.builder()
                    .userId(owner.getId())
                    .organizationId(org.getId())
                    .role(OrganizationRole.OWNER)
                    .build());

            // 3. Find default workflow
            Workflow workflow = workflowRepository.findAll().stream().findFirst().orElse(null);
            if (workflow == null)
                return;

            // 4. Create Project
            Project project = Project.builder()
                    .name("Project Alpha")
                    .description("A high-stakes agile project")
                    .organizationId(org.getId())
                    .workflowId(workflow.getId())
                    .build();
            project = projectRepository.save(project);

            // Add Owner as Project Admin
            projectMemberRepository.save(ProjectMember.builder()
                    .userId(owner.getId())
                    .projectId(project.getId())
                    .role(ProjectRole.PROJECT_ADMIN)
                    .build());

            // 5. Create and Add Team Members
            seedProjectMember(org, project, "scrum@workflow.com", "Sarah Scrum", ProjectRole.SCRUM_MASTER);
            seedProjectMember(org, project, "lead@workflow.com", "Larry Lead", ProjectRole.TEAM_LEAD);
            seedProjectMember(org, project, "dev@workflow.com", "David Dev", ProjectRole.DEVELOPER);
            seedProjectMember(org, project, "qa@workflow.com", "Quincy QA", ProjectRole.QA);
            seedProjectMember(org, project, "reporter@workflow.com", "Rick Reporter", ProjectRole.REPORTER);
            seedProjectMember(org, project, "viewer@workflow.com", "Victor Viewer", ProjectRole.VIEWER);

            System.out.println("DEMO TEAM SEEDED SUCCESSFULLY!");
            System.out.println("LOGIN: owner@workflow.com / password123");
            System.out.println("LOGIN: scrum@workflow.com / password123");
            System.out.println("LOGIN: dev@workflow.com / password123");
            System.out.println("LOGIN (SUPER_ADMIN): admin@workflow.com / Admin@123");
            System.out.println("----------------------------------------------------------");
        };
    }

    private void seedProjectMember(Organization org, Project project, String email, String name, ProjectRole role) {
        User user = createDemoUser(email, name);

        // Add to Organization
        organizationMemberRepository.save(OrganizationMember.builder()
                .userId(user.getId())
                .organizationId(org.getId())
                .role(OrganizationRole.MEMBER)
                .build());

        // Add to Project with specific role
        projectMemberRepository.save(ProjectMember.builder()
                .userId(user.getId())
                .projectId(project.getId())
                .role(role)
                .build());
    }

    private User createDemoUser(String email, String name) {
        User user = User.builder()
                .email(email)
                .displayName(name)
                .password(passwordEncoder.encode("password123"))
                .systemRole(SystemRole.USER)
                .active(true)
                .build();
        return userRepository.save(user);
    }
}
