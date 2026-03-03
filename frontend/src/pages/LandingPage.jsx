import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    HiOutlineArrowRight,
    HiOutlineCheckCircle,
    HiOutlineShieldCheck,
    HiOutlineLightningBolt,
    HiOutlineDuplicate,
    HiOutlineViewBoards,
    HiOutlineChartBar,
    HiOutlineLockClosed,
    HiOutlineGlobeAlt,
    HiOutlineDatabase,
    HiOutlineClipboardCheck
} from 'react-icons/hi';
import PublicLayout from '../components/layout/PublicLayout';
import DemoModal from '../components/DemoModal';

export default function LandingPage() {
    const [isDemoOpen, setIsDemoOpen] = useState(false);

    return (
        <PublicLayout>
            {/* ── 1. HERO ──────────────────────────────────── */}
            <section className="hero-section" id="hero" role="region" aria-label="Hero">
                <div className="hero-glow" aria-hidden="true" />

                <div className="landing-container hero-inner">
                    <div className="hero-content">
                        <span className="hero-badge">
                            <span className="hero-badge-dot" aria-hidden="true" />
                            Workflow Operating System for Enterprise
                        </span>

                        <h1 className="hero-headline">
                            Automate Complex Workflows.<br />
                            <span className="hero-headline-accent">Ship Faster. Govern Everything.</span>
                        </h1>

                        <p className="hero-description">
                            Design state-machine workflows, enforce SLA-driven approvals, and gain
                            full audit visibility — all from a single platform built for teams
                            that move fast and can't afford to break things.
                        </p>

                        <div className="hero-actions">
                            <Link to="/register" className="hero-btn-primary">
                                Get Started Free
                                <HiOutlineArrowRight aria-hidden="true" />
                            </Link>
                            <button
                                className="hero-btn-secondary"
                                onClick={() => setIsDemoOpen(true)}
                                aria-haspopup="dialog"
                            >
                                Book a Demo
                            </button>
                        </div>

                        <p className="hero-note">Free for up to 10 users · No credit card required</p>
                    </div>

                    <div className="hero-social-proof">
                        <span className="hero-social-label">Trusted by teams at</span>
                        <div className="hero-logos">
                            {['Stripe', 'Figma', 'Linear', 'Vercel', 'Notion'].map(name => (
                                <span key={name} className="hero-logo-item">{name}</span>
                            ))}
                        </div>
                    </div>

                    <div className="hero-mockup-wrapper" aria-hidden="true">
                        <div className="hero-mockup-frame">
                            <div className="mockup-chrome">
                                <div className="mockup-dots">
                                    <span /><span /><span />
                                </div>
                                <div className="mockup-address-bar">workflowengine.io/dashboard</div>
                            </div>

                            <div className="mockup-body">
                                <div className="mockup-sidebar">
                                    <div className="mockup-sidebar-logo" />
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`mockup-sidebar-item${i === 2 ? ' active' : ''}`}>
                                            <div className="mockup-sidebar-icon" />
                                            <div className="mockup-sidebar-label" style={{ width: `${50 + i * 8}%` }} />
                                        </div>
                                    ))}
                                </div>

                                <div className="mockup-main">
                                    <div className="mockup-topbar">
                                        <div className="mockup-breadcrumb">
                                            <div className="mockup-skel w-[64px]" />
                                            <span className="mockup-breadcrumb-sep">/</span>
                                            <div className="mockup-skel w-[96px]" />
                                        </div>
                                        <div className="mockup-topbar-actions">
                                            <div className="mockup-skel-btn" />
                                            <div className="mockup-skel-btn accent" />
                                        </div>
                                    </div>

                                    <div className="mockup-metrics">
                                        {[
                                            { label: 'Active Workflows', value: '248', color: '#3b82f6' },
                                            { label: 'Pending Approvals', value: '12', color: '#f59e0b' },
                                            { label: 'SLA Compliance', value: '99.2%', color: '#10b981' },
                                        ].map((m, i) => (
                                            <div key={i} className="mockup-metric-card">
                                                <div className="mockup-metric-value" style={{ color: m.color }}>{m.value}</div>
                                                <div className="mockup-metric-label">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mockup-kanban">
                                        {['To Do', 'In Review', 'Approved', 'Deployed'].map((col, ci) => (
                                            <div key={ci} className="mockup-kanban-col">
                                                <div className="mockup-kanban-header">
                                                    <span className="mockup-kanban-title">{col}</span>
                                                    <span className="mockup-kanban-count">{[3, 2, 4, 1][ci]}</span>
                                                </div>
                                                {Array.from({ length: [2, 2, 2, 1][ci] }).map((_, j) => (
                                                    <div key={j} className="mockup-kanban-card">
                                                        <div className="mockup-skel w-[70%] h-[8px]" />
                                                        <div className="mockup-skel w-[45%] h-[6px] opacity-40" />
                                                        <div className="mockup-kanban-card-footer">
                                                            <div className="mockup-avatar" />
                                                            <div className="mockup-skel w-[32px] h-[5px] opacity-30" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 2. FEATURES ──────────────────────────────── */}
            <section className="features-section" id="features" role="region" aria-label="Platform features">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-tag-center">Platform Capabilities</span>
                        <h2 className="section-title-center">Everything You Need to Automate</h2>
                        <p className="section-subtitle-center">
                            Powerful features that adapt to your team's workflow — from simple approvals to complex multi-stage processes.
                        </p>
                    </div>

                    <div className="features-grid">
                        {[
                            { icon: <HiOutlineViewBoards />, title: 'Visual Workflow Builder', desc: 'Drag-and-drop state designer with conditional transitions' },
                            { icon: <HiOutlineLightningBolt />, title: 'SLA-Driven Automation', desc: 'Time-based triggers and automatic escalation rules' },
                            { icon: <HiOutlineClipboardCheck />, title: 'Multi-Level Approvals', desc: 'Sequential and parallel approval chains with delegation' },
                            { icon: <HiOutlineChartBar />, title: 'Real-Time Analytics', desc: 'Cycle time analysis and bottleneck detection' },
                            { icon: <HiOutlineDatabase />, title: 'Audit Trail', desc: 'Immutable logs for every transition and approval decision' },
                            { icon: <HiOutlineLockClosed />, title: 'Role-Based Access', desc: 'Granular permissions down to individual workflow states' },
                            { icon: <HiOutlineGlobeAlt />, title: 'API & Webhooks', desc: 'RESTful API and real-time webhook integrations' },
                            { icon: <HiOutlineShieldCheck />, title: 'Custom Notifications', desc: 'Email, Slack, Teams alerts with smart routing' },
                            { icon: <HiOutlineDuplicate />, title: 'Version Control', desc: 'Track changes with rollback and branching support' },
                        ].map((feature, i) => (
                            <div key={i} className="feature-card" role="listitem">
                                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-desc">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 3. DEMO ───────────────────────────────────── */}
            <section className="demo-section" id="demo" role="region" aria-label="Product demonstration">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-tag-center">See It In Action</span>
                        <h2 className="section-title-center">Built for Teams That Move Fast</h2>
                        <p className="section-subtitle-center">
                            Deploy production-ready workflows in hours, not weeks.
                        </p>
                    </div>

                    <div className="demo-visual">
                        <div className="demo-frame">
                            <div className="demo-label top-left">Real-time state tracking</div>
                            <div className="demo-label top-right">Auto-assigned reviewers</div>
                            <div className="demo-label bottom-left">SLA countdown timer</div>

                            <div className="demo-content">
                                <div className="demo-workflow-bar">
                                    {['Draft', 'Review', 'Approved', 'Deployed'].map((state, i) => (
                                        <div key={i} className={`demo-state ${i === 1 ? 'active' : ''}`}>
                                            <div className="demo-state-dot" />
                                            <span className="demo-state-name">{state}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="demo-card-stack">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="demo-task-card" style={{ transform: `translateY(${i * 8}px)` }}>
                                            <div className="demo-task-header">
                                                <div className="demo-task-title" style={{ width: `${60 + i * 15}%` }} />
                                                <div className="demo-task-badge">High</div>
                                            </div>
                                            <div className="demo-task-meta">
                                                <div className="demo-avatar-group">
                                                    <div className="demo-avatar" />
                                                    <div className="demo-avatar" />
                                                </div>
                                                <div className="demo-task-time">2h left</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 4. TESTIMONIALS ───────────────────────────── */}
            <section className="testimonials-section" id="testimonials" role="region" aria-label="Customer testimonials">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-tag-center">Customer Stories</span>
                        <h2 className="section-title-center">Trusted by Industry Leaders</h2>
                    </div>

                    <div className="testimonials-grid">
                        {[
                            { quote: 'WorkflowEngine reduced our approval cycle time from 14 days to 2 days. The audit trail alone is worth the investment.', author: 'Sarah Chen', role: 'VP Operations', company: 'TechCorp' },
                            { quote: 'We replaced 5 different tools with one platform. Our team actually enjoys using it.', author: 'Michael Torres', role: 'CTO', company: 'StartupXYZ' },
                            { quote: 'Best compliance tool we\'ve deployed. SOC 2 auditors loved the immutable logs.', author: 'Priya Sharma', role: 'InfoSec Director', company: 'FinanceHub' },
                        ].map((t, i) => (
                            <div key={i} className="testimonial-card" role="article">
                                <p className="testimonial-quote">"{t.quote}"</p>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar" aria-hidden="true" />
                                    <div>
                                        <div className="testimonial-name">{t.author}</div>
                                        <div className="testimonial-meta">{t.role}, {t.company}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 5. CAPABILITIES ────────────────────────────── */}
            <section className="capabilities-section" id="capabilities" role="region" aria-label="Platform capabilities">
                <div className="landing-container">
                    <div className="capability-item">
                        <div className="capability-visual" aria-hidden="true">
                            <div className="capability-mockup">
                                <div className="capability-node">Draft</div>
                                <div className="capability-arrow">→</div>
                                <div className="capability-node active">Review</div>
                                <div className="capability-arrow">→</div>
                                <div className="capability-node">Approved</div>
                                <div className="capability-rule">
                                    <code>if (priority === 'HIGH') skip_level_1();</code>
                                </div>
                            </div>
                        </div>
                        <div className="capability-text">
                            <h3 className="capability-title">Workflow Engine</h3>
                            <p className="capability-desc">Design state machines with conditional logic, parallel paths, and automatic transitions. Every workflow is version-controlled and auditable.</p>
                            <ul className="capability-features">
                                <li><HiOutlineCheckCircle aria-hidden="true" /> Drag-and-drop state designer</li>
                                <li><HiOutlineCheckCircle aria-hidden="true" /> Conditional transition rules</li>
                                <li><HiOutlineCheckCircle aria-hidden="true" /> Parallel approval paths</li>
                            </ul>
                        </div>
                    </div>

                    <div className="capability-item reverse">
                        <div className="capability-visual" aria-hidden="true">
                            <div className="capability-mockup">
                                <div className="automation-rule">
                                    <span className="rule-label">Trigger</span>
                                    <span className="rule-value">Task idle &gt; 48h</span>
                                </div>
                                <div className="automation-rule">
                                    <span className="rule-label">Action</span>
                                    <span className="rule-value">Escalate to manager</span>
                                </div>
                                <div className="automation-rule">
                                    <span className="rule-label">Notify</span>
                                    <span className="rule-value">Slack + Email</span>
                                </div>
                            </div>
                        </div>
                        <div className="capability-text">
                            <h3 className="capability-title">Automation Hub</h3>
                            <p className="capability-desc">Set time-based triggers, define actions, and route notifications automatically. Never let a task fall through the cracks.</p>
                            <ul className="capability-features">
                                <li><HiOutlineCheckCircle aria-hidden="true" /> SLA countdown timers</li>
                                <li><HiOutlineCheckCircle aria-hidden="true" /> Smart escalation rules</li>
                                <li><HiOutlineCheckCircle aria-hidden="true" /> Multi-channel notifications</li>
                            </ul>
                        </div>
                    </div>

                    <div className="capability-item">
                        <div className="capability-visual" aria-hidden="true">
                            <div className="capability-mockup">
                                <div className="governance-log">
                                    {['Approved by sarah@co', 'State: Review → Approved', 'Timestamp: 2024-02-12'].map((log, i) => (
                                        <div key={i} className="governance-log-line" style={{ opacity: 1 - i * 0.25 }}>
                                            <div className="governance-log-dot" />
                                            <span className="governance-log-text">{log}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="capability-text">
                            <h3 className="capability-title">Governance Layer</h3>
                            <p className="capability-desc">Complete audit trail, role-based permissions, and compliance-ready logs. Built for teams that can't afford mistakes.</p>
                            <ul className="capability-features">
                                <li><HiOutlineCheckCircle aria-hidden="true" /> Immutable audit logs</li>
                                <li><HiOutlineCheckCircle aria-hidden="true" /> Granular permissions</li>
                                <li><HiOutlineCheckCircle aria-hidden="true" /> SOC 2 ready</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 6. INTEGRATIONS ────────────────────────────── */}
            <section className="integrations-section" id="integrations" role="region" aria-label="Integration partners">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-tag-center">Integrations</span>
                        <h2 className="section-title-center">Works With Your Stack</h2>
                        <p className="section-subtitle-center">Connect to the tools you already use</p>
                    </div>

                    <div className="integrations-grid" role="list">
                        {['Slack', 'Microsoft Teams', 'Google Workspace', 'Salesforce', 'HubSpot', 'SAP', 'AWS', 'Azure', 'GCP', 'GitHub', 'GitLab', 'Jira'].map(name => (
                            <div key={name} className="integration-logo" role="listitem">{name}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 7. SECURITY ─────────────────────────────────── */}
            <section className="security-section" id="security" role="region" aria-label="Security and compliance">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-tag-center">Security & Compliance</span>
                        <h2 className="section-title-center">Enterprise-Grade Trust</h2>
                    </div>

                    <div className="security-grid" role="list">
                        {[
                            { badge: 'SOC 2 Type II', desc: 'Certified' },
                            { badge: 'ISO 27001', desc: 'Certified' },
                            { badge: 'GDPR', desc: 'Compliant' },
                            { badge: 'HIPAA', desc: 'Ready' },
                            { badge: 'SSO/SAML', desc: 'Supported' },
                            { badge: '99.9% Uptime', desc: 'SLA Guaranteed' },
                        ].map((item, i) => (
                            <div key={i} className="security-badge" role="listitem">
                                <div className="security-badge-icon" aria-hidden="true">
                                    <HiOutlineShieldCheck />
                                </div>
                                <div className="security-badge-title">{item.badge}</div>
                                <div className="security-badge-desc">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 8. PRICING ───────────────────────────────────── */}
            <section className="pricing-section" id="pricing" role="region" aria-label="Pricing plans">
                <div className="landing-container">
                    <div className="section-header">
                        <span className="section-tag-center">Pricing</span>
                        <h2 className="section-title-center">Plans That Scale With You</h2>
                    </div>

                    <div className="pricing-grid">
                        {[
                            { name: 'Starter', price: 'Free', period: 'forever', desc: 'For teams getting started', features: ['Up to 10 users', '100 tasks/month', 'Basic workflows', 'Email support'], cta: 'Start Free', highlighted: false },
                            { name: 'Professional', price: '$29', period: 'per user/month', desc: 'For growing teams', features: ['Unlimited users', 'Unlimited tasks', 'Advanced automation', 'Priority support', 'API access', 'Custom integrations'], cta: 'Start Trial', highlighted: true },
                            { name: 'Enterprise', price: 'Custom', period: 'contact sales', desc: 'For large organizations', features: ['Everything in Pro', 'SSO/SAML', 'Dedicated success manager', 'SLA guarantee', 'On-premise option', 'Custom training'], cta: 'Contact Sales', highlighted: false },
                        ].map((plan, i) => (
                            <div key={i} className={`pricing-card ${plan.highlighted ? 'highlighted' : ''}`} role="article">
                                {plan.highlighted && <div className="pricing-badge">Most Popular</div>}
                                <div className="pricing-header">
                                    <h3 className="pricing-name">{plan.name}</h3>
                                    <div className="pricing-price">
                                        {plan.price}
                                        {plan.price !== 'Custom' && <span className="pricing-period">/{plan.period}</span>}
                                    </div>
                                    <p className="pricing-desc">{plan.desc}</p>
                                </div>
                                <ul className="pricing-features" role="list">
                                    {plan.features.map((f, j) => (
                                        <li key={j}><HiOutlineCheckCircle aria-hidden="true" /> {f}</li>
                                    ))}
                                </ul>
                                <button className={`pricing-cta ${plan.highlighted ? 'primary' : 'secondary'}`}>
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 9. FAQ ───────────────────────────────────────── */}
            <section className="faq-section" id="faq" role="region" aria-label="Frequently asked questions">
                <div className="landing-container faq-container">
                    <div className="section-header">
                        <span className="section-tag-center">FAQ</span>
                        <h2 className="section-title-center">Common Questions</h2>
                    </div>

                    <div className="faq-list">
                        {[
                            { q: 'How is this different from Jira or Asana?', a: 'WorkflowEngine is purpose-built for complex approval workflows and governance. While Jira/Asana are great for task tracking, we focus on state machines, SLA enforcement, and audit trails required for enterprise operations.' },
                            { q: 'Can I migrate existing workflows?', a: 'Yes. We provide CSV import, API migration tools, and a dedicated migration team for Enterprise customers. Most teams are fully migrated within 2 weeks.' },
                            { q: 'What integrations are available?', a: 'We integrate with Slack, Teams, Google Workspace, Salesforce, Jira, GitHub, and 50+ other platforms via API and webhooks. Custom integrations available on Enterprise plans.' },
                            { q: 'Is my data encrypted?', a: 'Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We\'re SOC 2 Type II certified and GDPR compliant.' },
                            { q: 'Do you offer on-premise deployment?', a: 'Yes, on-premise and private cloud deployments are available on Enterprise plans. Contact sales for details.' },
                        ].map((item, i) => (
                            <details key={i} className="faq-item">
                                <summary className="faq-question">
                                    {item.q}
                                    <HiOutlineArrowRight className="faq-icon" aria-hidden="true" />
                                </summary>
                                <div className="faq-answer">{item.a}</div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 10. FINAL CTA ────────────────────────────────── */}
            <section className="final-cta-section" id="signup" role="region" aria-label="Get started">
                <div className="landing-container">
                    <div className="final-cta-content">
                        <h2 className="final-cta-title">Ready to Automate Your Workflows?</h2>
                        <p className="final-cta-desc">
                            Join 500+ teams already shipping faster with WorkflowEngine.
                            Start free, no credit card required.
                        </p>
                        <div className="final-cta-actions">
                            <Link to="/register" className="final-cta-btn-primary">
                                Get Started Free
                                <HiOutlineArrowRight aria-hidden="true" />
                            </Link>
                            <button
                                className="final-cta-btn-secondary"
                                onClick={() => setIsDemoOpen(true)}
                                aria-haspopup="dialog"
                            >
                                Schedule Demo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
        </PublicLayout>
    );
}
