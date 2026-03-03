CREATE TABLE automation_rules (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,
    conditions_json TEXT,
    action_type VARCHAR(50) NOT NULL,
    action_config_json TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_automation_rules_project_event ON automation_rules(project_id, trigger_event) WHERE active = TRUE;
