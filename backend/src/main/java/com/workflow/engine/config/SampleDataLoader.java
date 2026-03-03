package com.workflow.engine.config;

import com.workflow.engine.auth.entity.SystemRole;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.organization.entity.Organization;
import com.workflow.engine.organization.repository.OrganizationRepository;
import com.workflow.engine.rbac.entity.OrganizationMember;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.task.entity.Priority;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.entity.Workflow;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import com.workflow.engine.workflow.repository.WorkflowRepository;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Configuration
@Profile("dev")
@RequiredArgsConstructor
public class SampleDataLoader {

        private static final Logger log = LoggerFactory.getLogger(SampleDataLoader.class);

        private final UserRepository userRepository;
        private final OrganizationRepository organizationRepository;
        private final OrganizationMemberRepository organizationMemberRepository;
        private final ProjectRepository projectRepository;
        private final WorkflowRepository workflowRepository;
        private final WorkflowStateRepository workflowStateRepository;
        private final WorkflowTransitionRepository workflowTransitionRepository;
        private final TaskRepository taskRepository;
        private final PasswordEncoder passwordEncoder;

        @Bean
        CommandLineRunner loadSampleData() {
                return args -> {
                        log.info("Loading sample data...");

                        // Check if data already exists
                        if (userRepository.count() > 2) {
                                log.info("Sample data already exists ({} users), skipping data generation...",
                                                userRepository.count());
                                return;
                        }

                        // Create Users
                        User alice = createUser("alice@example.com", "Alice Johnson", SystemRole.USER);
                        User bob = createUser("bob@example.com", "Bob Smith", SystemRole.USER);
                        User charlie = createUser("charlie@example.com", "Charlie Davis", SystemRole.USER);
                        User diana = createUser("diana@example.com", "Diana Martinez", SystemRole.USER);

                        // Create Organizations
                        Organization techCorp = createOrganization("TechCorp", "Leading technology solutions provider");
                        Organization designStudio = createOrganization("Design Studio",
                                        "Creative design and branding agency");
                        Organization marketingPro = createOrganization("Marketing Pro", "Digital marketing excellence");

                        // Add members to organizations
                        addMember(techCorp, alice, OrganizationRole.OWNER);
                        addMember(techCorp, bob, OrganizationRole.ADMIN);
                        addMember(techCorp, charlie, OrganizationRole.MEMBER);

                        addMember(designStudio, alice, OrganizationRole.ADMIN);
                        addMember(designStudio, diana, OrganizationRole.OWNER);

                        addMember(marketingPro, bob, OrganizationRole.OWNER);
                        addMember(marketingPro, charlie, OrganizationRole.MEMBER);
                        addMember(marketingPro, diana, OrganizationRole.MEMBER);

                        // Create Workflows
                        Workflow softwareDevWorkflow = createSoftwareDevelopmentWorkflow(techCorp);
                        Workflow designWorkflow = createDesignWorkflow(designStudio);
                        Workflow marketingCampaignWorkflow = createMarketingWorkflow(marketingPro);

                        // Create Projects
                        Project mobileApp = createProject(techCorp, "Mobile App Redesign",
                                        "Complete redesign of our flagship mobile application", softwareDevWorkflow);
                        Project webPlatform = createProject(techCorp, "Web Platform v2.0",
                                        "Next generation web platform with AI features", softwareDevWorkflow);

                        Project brandingProject = createProject(designStudio, "Client Branding Package",
                                        "Complete branding package for new startup client", designWorkflow);

                        Project q1Campaign = createProject(marketingPro, "Q1 Marketing Campaign",
                                        "Digital marketing campaign for Q1 2026", marketingCampaignWorkflow);

                        // Get states for task creation
                        List<WorkflowState> devStates = workflowStateRepository
                                        .findByWorkflowIdOrderByPositionAsc(softwareDevWorkflow.getId());
                        List<WorkflowState> designStates = workflowStateRepository
                                        .findByWorkflowIdOrderByPositionAsc(designWorkflow.getId());
                        List<WorkflowState> marketStates = workflowStateRepository
                                        .findByWorkflowIdOrderByPositionAsc(marketingCampaignWorkflow.getId());

                        // Create Tasks
                        createTasksForMobileApp(mobileApp, techCorp, devStates, alice, bob, charlie);
                        createTasksForWebPlatform(webPlatform, techCorp, devStates, alice, bob);
                        createTasksForBranding(brandingProject, designStudio, designStates, diana, alice);
                        createTasksForMarketing(q1Campaign, marketingPro, marketStates, bob, charlie, diana);

                        log.info("Sample data loaded successfully!");
                        log.info("Created {} users, {} organizations, {} projects, {} tasks",
                                        userRepository.count(), organizationRepository.count(),
                                        projectRepository.count(), taskRepository.count());
                };
        }

        private User createUser(String email, String displayName, SystemRole role) {
                User user = new User();
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode("password123"));
                user.setDisplayName(displayName);
                user.setSystemRole(role);
                return userRepository.save(user);
        }

        private Organization createOrganization(String name, String description) {
                Organization org = new Organization();
                org.setName(name);
                org.setDescription(description);
                return organizationRepository.save(org);
        }

        private void addMember(Organization org, User user, OrganizationRole role) {
                OrganizationMember member = new OrganizationMember();
                member.setOrganizationId(org.getId());
                member.setUserId(user.getId());
                member.setRole(role);
                organizationMemberRepository.save(member);
        }

        private Project createProject(Organization org, String name, String description, Workflow workflow) {
                Project project = new Project();
                project.setOrganizationId(org.getId());
                project.setName(name);
                project.setDescription(description);
                project.setWorkflowId(workflow.getId());
                return projectRepository.save(project);
        }

        private Workflow createSoftwareDevelopmentWorkflow(Organization org) {
                Workflow workflow = new Workflow();
                workflow.setOrganizationId(org.getId());
                workflow.setName("Software Development Lifecycle");
                workflow.setDescription("Standard SDLC workflow for software projects");
                workflow.setActive(true);
                workflow = workflowRepository.save(workflow);

                WorkflowState backlog = createState(workflow, "Backlog", StateType.START, 0);
                WorkflowState inProgress = createState(workflow, "In Progress", StateType.IN_PROGRESS, 1);
                WorkflowState codeReview = createState(workflow, "Code Review", StateType.IN_PROGRESS, 2);
                WorkflowState testing = createState(workflow, "Testing", StateType.IN_PROGRESS, 3);
                WorkflowState done = createState(workflow, "Done", StateType.DONE, 4);

                createTransition(workflow, "Start Work", backlog, inProgress, false);
                createTransition(workflow, "Submit for Review", inProgress, codeReview, false);
                createTransition(workflow, "Request Changes", codeReview, inProgress, false);
                createTransition(workflow, "Approve & Test", codeReview, testing, true);
                createTransition(workflow, "Complete", testing, done, false);
                createTransition(workflow, "Reopen", done, backlog, false);

                return workflow;
        }

        private Workflow createDesignWorkflow(Organization org) {
                Workflow workflow = new Workflow();
                workflow.setOrganizationId(org.getId());
                workflow.setName("Design Process");
                workflow.setDescription("Creative design workflow from concept to delivery");
                workflow.setActive(true);
                workflow = workflowRepository.save(workflow);

                WorkflowState ideation = createState(workflow, "Ideation", StateType.START, 0);
                WorkflowState drafting = createState(workflow, "Drafting", StateType.IN_PROGRESS, 1);
                WorkflowState clientReview = createState(workflow, "Client Review", StateType.IN_PROGRESS, 2);
                WorkflowState revisions = createState(workflow, "Revisions", StateType.IN_PROGRESS, 3);
                WorkflowState approved = createState(workflow, "Approved", StateType.DONE, 4);

                createTransition(workflow, "Start Design", ideation, drafting, false);
                createTransition(workflow, "Submit to Client", drafting, clientReview, false);
                createTransition(workflow, "Request Revisions", clientReview, revisions, false);
                createTransition(workflow, "Approve", clientReview, approved, true);
                createTransition(workflow, "Resubmit", revisions, clientReview, false);

                return workflow;
        }

        private Workflow createMarketingWorkflow(Organization org) {
                Workflow workflow = new Workflow();
                workflow.setOrganizationId(org.getId());
                workflow.setName("Marketing Campaign");
                workflow.setDescription("Marketing campaign execution workflow");
                workflow.setActive(true);
                workflow = workflowRepository.save(workflow);

                WorkflowState planning = createState(workflow, "Planning", StateType.START, 0);
                WorkflowState contentCreation = createState(workflow, "Content Creation", StateType.IN_PROGRESS, 1);
                WorkflowState scheduled = createState(workflow, "Scheduled", StateType.IN_PROGRESS, 2);
                WorkflowState live = createState(workflow, "Live", StateType.IN_PROGRESS, 3);
                WorkflowState completed = createState(workflow, "Completed", StateType.DONE, 4);

                createTransition(workflow, "Create Content", planning, contentCreation, false);
                createTransition(workflow, "Schedule", contentCreation, scheduled, false);
                createTransition(workflow, "Go Live", scheduled, live, true);
                createTransition(workflow, "Complete Campaign", live, completed, false);

                return workflow;
        }

        private WorkflowState createState(Workflow workflow, String name, StateType type, int position) {
                WorkflowState state = new WorkflowState();
                state.setWorkflowId(workflow.getId());
                state.setName(name);
                state.setType(type);
                state.setPosition(position);
                return workflowStateRepository.save(state);
        }

        private WorkflowTransition createTransition(Workflow workflow, String name, WorkflowState from,
                        WorkflowState to, boolean requiresApproval) {
                WorkflowTransition transition = new WorkflowTransition();
                transition.setWorkflowId(workflow.getId());
                transition.setName(name);
                transition.setFromStateId(from.getId());
                transition.setToStateId(to.getId());
                transition.setRequiresApproval(requiresApproval);
                return workflowTransitionRepository.save(transition);
        }

        private void createTasksForMobileApp(Project project, Organization org, List<WorkflowState> states, User alice,
                        User bob, User charlie) {
                WorkflowState backlog = states.stream().filter(s -> s.getName().equals("Backlog")).findFirst()
                                .orElse(states.get(0));
                WorkflowState inProgress = states.stream().filter(s -> s.getName().equals("In Progress")).findFirst()
                                .orElse(states.get(1));
                WorkflowState codeReview = states.stream().filter(s -> s.getName().equals("Code Review")).findFirst()
                                .orElse(states.get(2));

                createTask(project, org, "Design new UI mockups", "Create modern UI designs for all main screens",
                                Priority.HIGH, alice, backlog);
                createTask(project, org, "Implement authentication flow",
                                "Build OAuth2 authentication with social login", Priority.URGENT, bob, inProgress);
                createTask(project, org, "Optimize image loading", "Implement lazy loading and caching for images",
                                Priority.MEDIUM, charlie, codeReview);
                createTask(project, org, "Add dark mode support", "Implement dark theme across the application",
                                Priority.LOW, alice, backlog);
                createTask(project, org, "Fix navigation bugs", "Resolve issues with back button navigation",
                                Priority.HIGH, bob, inProgress);
        }

        private void createTasksForWebPlatform(Project project, Organization org, List<WorkflowState> states,
                        User alice, User bob) {
                WorkflowState backlog = states.stream().filter(s -> s.getName().equals("Backlog")).findFirst()
                                .orElse(states.get(0));
                WorkflowState inProgress = states.stream().filter(s -> s.getName().equals("In Progress")).findFirst()
                                .orElse(states.get(1));

                createTask(project, org, "Set up AI integration", "Integrate OpenAI API for smart features",
                                Priority.URGENT, alice, inProgress);
                createTask(project, org, "Build analytics dashboard", "Create comprehensive analytics and reporting",
                                Priority.HIGH, bob, backlog);
                createTask(project, org, "Implement real-time notifications", "Add WebSocket support for live updates",
                                Priority.MEDIUM, alice, backlog);
        }

        private void createTasksForBranding(Project project, Organization org, List<WorkflowState> states, User diana,
                        User alice) {
                WorkflowState ideation = states.stream().filter(s -> s.getName().equals("Ideation")).findFirst()
                                .orElse(states.get(0));
                WorkflowState drafting = states.stream().filter(s -> s.getName().equals("Drafting")).findFirst()
                                .orElse(states.get(1));

                createTask(project, org, "Logo concept sketches", "Create 5 initial logo concepts", Priority.HIGH,
                                diana, drafting);
                createTask(project, org, "Color palette selection", "Define primary and secondary color schemes",
                                Priority.MEDIUM, alice, ideation);
                createTask(project, org, "Typography guidelines", "Select and document brand fonts", Priority.MEDIUM,
                                diana, ideation);
        }

        private void createTasksForMarketing(Project project, Organization org, List<WorkflowState> states, User bob,
                        User charlie, User diana) {
                WorkflowState planning = states.stream().filter(s -> s.getName().equals("Planning")).findFirst()
                                .orElse(states.get(0));
                WorkflowState contentCreation = states.stream().filter(s -> s.getName().equals("Content Creation"))
                                .findFirst().orElse(states.get(1));
                WorkflowState scheduled = states.stream().filter(s -> s.getName().equals("Scheduled")).findFirst()
                                .orElse(states.get(2));

                createTask(project, org, "Social media strategy", "Define posting schedule and content themes",
                                Priority.HIGH, bob, contentCreation);
                createTask(project, org, "Email campaign design", "Create email templates and copy", Priority.MEDIUM,
                                charlie, scheduled);
                createTask(project, org, "Analytics setup", "Configure Google Analytics and tracking", Priority.HIGH,
                                diana, planning);
                createTask(project, org, "Influencer outreach", "Identify and contact potential partners", Priority.LOW,
                                bob, planning);
        }

        private Task createTask(Project project, Organization org, String title, String description, Priority priority,
                        User assignee, WorkflowState state) {
                Task task = new Task();
                task.setProjectId(project.getId());
                task.setOrganizationId(org.getId());
                task.setTitle(title);
                task.setDescription(description);
                task.setPriority(priority);
                task.setAssigneeId(assignee.getId());
                task.setCurrentStateId(state.getId());
                return taskRepository.save(task);
        }
}
