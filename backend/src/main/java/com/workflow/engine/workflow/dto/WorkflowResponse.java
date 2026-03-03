package com.workflow.engine.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

public class WorkflowResponse {
    private String id;
    private String name;
    private String description;
    private String organizationId;
    private String role;
    private boolean active;
    private List<StateResponse> states;
    private List<TransitionResponse> transitions;
    private String createdAt;

    public WorkflowResponse() {
    }

    public WorkflowResponse(String id, String name, String description, String organizationId, String role,
            boolean active,
            List<StateResponse> states, List<TransitionResponse> transitions, String createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.organizationId = organizationId;
        this.role = role;
        this.active = active;
        this.states = states;
        this.transitions = transitions;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public List<StateResponse> getStates() {
        return states;
    }

    public void setStates(List<StateResponse> states) {
        this.states = states;
    }

    public List<TransitionResponse> getTransitions() {
        return transitions;
    }

    public void setTransitions(List<TransitionResponse> transitions) {
        this.transitions = transitions;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public static WorkflowResponseBuilder builder() {
        return new WorkflowResponseBuilder();
    }

    public static class WorkflowResponseBuilder {
        private String id;
        private String name;
        private String description;
        private String organizationId;
        private String role;
        private boolean active;
        private List<StateResponse> states;
        private List<TransitionResponse> transitions;
        private String createdAt;

        public WorkflowResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public WorkflowResponseBuilder name(String name) {
            this.name = name;
            return this;
        }

        public WorkflowResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public WorkflowResponseBuilder organizationId(String organizationId) {
            this.organizationId = organizationId;
            return this;
        }

        public WorkflowResponseBuilder role(String role) {
            this.role = role;
            return this;
        }

        public WorkflowResponseBuilder active(boolean active) {
            this.active = active;
            return this;
        }

        public WorkflowResponseBuilder states(List<StateResponse> states) {
            this.states = states;
            return this;
        }

        public WorkflowResponseBuilder transitions(List<TransitionResponse> transitions) {
            this.transitions = transitions;
            return this;
        }

        public WorkflowResponseBuilder createdAt(String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public WorkflowResponse build() {
            return new WorkflowResponse(id, name, description, organizationId, role, active, states, transitions,
                    createdAt);
        }
    }

    public static class StateResponse {
        private String id;
        private String name;
        private String type;
        private int position;
        private Double positionX;
        private Double positionY;
        private Integer wipLimit;

        public StateResponse() {
        }

        public StateResponse(String id, String name, String type, int position, Double positionX, Double positionY,
                Integer wipLimit) {
            this.id = id;
            this.name = name;
            this.type = type;
            this.position = position;
            this.positionX = positionX;
            this.positionY = positionY;
            this.wipLimit = wipLimit;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public int getPosition() {
            return position;
        }

        public void setPosition(int position) {
            this.position = position;
        }

        public Double getPositionX() {
            return positionX;
        }

        public void setPositionX(Double positionX) {
            this.positionX = positionX;
        }

        public Double getPositionY() {
            return positionY;
        }

        public void setPositionY(Double positionY) {
            this.positionY = positionY;
        }

        public Integer getWipLimit() {
            return wipLimit;
        }

        public void setWipLimit(Integer wipLimit) {
            this.wipLimit = wipLimit;
        }

        public static StateResponseBuilder builder() {
            return new StateResponseBuilder();
        }

        public static class StateResponseBuilder {
            private String id;
            private String name;
            private String type;
            private int position;
            private Double positionX;
            private Double positionY;
            private Integer wipLimit;

            public StateResponseBuilder id(String id) {
                this.id = id;
                return this;
            }

            public StateResponseBuilder name(String name) {
                this.name = name;
                return this;
            }

            public StateResponseBuilder type(String type) {
                this.type = type;
                return this;
            }

            public StateResponseBuilder position(int position) {
                this.position = position;
                return this;
            }

            public StateResponseBuilder positionX(Double positionX) {
                this.positionX = positionX;
                return this;
            }

            public StateResponseBuilder positionY(Double positionY) {
                this.positionY = positionY;
                return this;
            }

            public StateResponseBuilder wipLimit(Integer wipLimit) {
                this.wipLimit = wipLimit;
                return this;
            }

            public StateResponse build() {
                return new StateResponse(id, name, type, position, positionX, positionY, wipLimit);
            }
        }
    }

    public static class TransitionResponse {
        private String id;
        private String name;
        private String fromStateId;
        private String toStateId;
        private boolean requiresApproval;

        public TransitionResponse() {
        }

        public TransitionResponse(String id, String name, String fromStateId, String toStateId,
                boolean requiresApproval) {
            this.id = id;
            this.name = name;
            this.fromStateId = fromStateId;
            this.toStateId = toStateId;
            this.requiresApproval = requiresApproval;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getFromStateId() {
            return fromStateId;
        }

        public void setFromStateId(String fromStateId) {
            this.fromStateId = fromStateId;
        }

        public String getToStateId() {
            return toStateId;
        }

        public void setToStateId(String toStateId) {
            this.toStateId = toStateId;
        }

        public boolean isRequiresApproval() {
            return requiresApproval;
        }

        public void setRequiresApproval(boolean requiresApproval) {
            this.requiresApproval = requiresApproval;
        }

        public static TransitionResponseBuilder builder() {
            return new TransitionResponseBuilder();
        }

        public static class TransitionResponseBuilder {
            private String id;
            private String name;
            private String fromStateId;
            private String toStateId;
            private boolean requiresApproval;

            public TransitionResponseBuilder id(String id) {
                this.id = id;
                return this;
            }

            public TransitionResponseBuilder name(String name) {
                this.name = name;
                return this;
            }

            public TransitionResponseBuilder fromStateId(String fromStateId) {
                this.fromStateId = fromStateId;
                return this;
            }

            public TransitionResponseBuilder toStateId(String toStateId) {
                this.toStateId = toStateId;
                return this;
            }

            public TransitionResponseBuilder requiresApproval(boolean requiresApproval) {
                this.requiresApproval = requiresApproval;
                return this;
            }

            public TransitionResponse build() {
                return new TransitionResponse(id, name, fromStateId, toStateId, requiresApproval);
            }
        }
    }
}
