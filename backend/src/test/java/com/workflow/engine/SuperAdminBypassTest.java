package com.workflow.engine;

import com.workflow.engine.auth.entity.SystemRole;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.organization.entity.Organization;
import com.workflow.engine.organization.repository.OrganizationRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.organization.service.OrganizationService;
import com.workflow.engine.organization.dto.OrganizationResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class SuperAdminBypassTest {

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private OrganizationRepository organizationRepository;

        @Autowired
        private PermissionService permissionService;

        @Autowired
        private OrganizationService organizationService;

        @Test
        public void testSuperAdminBypass() {
                // 1. Create a normal user and an organization
                User owner = User.builder()
                                .email("owner@test.com")
                                .password("hash")
                                .displayName("Owner")
                                .systemRole(SystemRole.USER)
                                .build();
                owner = userRepository.save(owner);

                Organization org = Organization.builder()
                                .name("Test Org")
                                .ownerId(owner.getId())
                                .build();
                org = organizationRepository.save(org);

                // 2. Create a Super Admin user (not a member of the org)
                User superAdmin = User.builder()
                                .email("superadmin@test.com")
                                .password("hash")
                                .displayName("Super Admin")
                                .systemRole(SystemRole.SUPER_ADMIN)
                                .build();
                superAdmin = userRepository.save(superAdmin);

                // 3. Verify bypass in PermissionService
                final UUID superAdminId = superAdmin.getId();
                final UUID orgId = org.getId();

                assertDoesNotThrow(
                                () -> permissionService.checkPermission(superAdminId, orgId, OrganizationRole.OWNER));
                assertEquals(OrganizationRole.OWNER, permissionService.getUserRole(superAdminId, orgId));

                // 4. Verify bypass in OrganizationService list
                List<OrganizationResponse> orgs = organizationService.listUserOrganizations(superAdminId);
                assertTrue(orgs.stream().anyMatch(o -> o.getId().equals(orgId.toString())));
        }
}
