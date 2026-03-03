import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import { FaTwitter, FaLinkedin, FaGithub } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="modern-footer">
            <div className="landing-container footer-inner">
                {/* Main Footer Grid */}
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-brand">
                        <Link to="/" className="footer-logo-link">
                            <HiOutlineLightningBolt className="footer-logo-icon" />
                            <span className="footer-logo-text">WorkflowEngine</span>
                        </Link>
                        <p className="footer-tagline">
                            Enterprise workflow automation that scales with your team.
                        </p>
                    </div>

                    {/* Product Column */}
                    <div className="footer-column">
                        <h3 className="footer-column-title">Product</h3>
                        <ul className="footer-links">
                            <li><a href="#features">Features</a></li>
                            <li><a href="#integrations">Integrations</a></li>
                            <li><a href="#security">Security</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                            <li><a href="#demo">Request Demo</a></li>
                        </ul>
                    </div>

                    {/* Company Column */}
                    <div className="footer-column">
                        <h3 className="footer-column-title">Company</h3>
                        <ul className="footer-links">
                            <li><a href="/about">About</a></li>
                            <li><a href="/blog">Blog</a></li>
                            <li><a href="/careers">Careers</a></li>
                            <li><a href="/contact">Contact</a></li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div className="footer-column">
                        <h3 className="footer-column-title">Resources</h3>
                        <ul className="footer-links">
                            <li><a href="/docs">Documentation</a></li>
                            <li><a href="/api">API Reference</a></li>
                            <li><a href="/support">Support</a></li>
                            <li><a href="/status">System Status</a></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div className="footer-column">
                        <h3 className="footer-column-title">Legal</h3>
                        <ul className="footer-links">
                            <li><a href="/privacy">Privacy Policy</a></li>
                            <li><a href="/terms">Terms of Service</a></li>
                            <li><a href="/security">Security</a></li>
                            <li><a href="/compliance">Compliance</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="footer-bottom">
                    <p className="footer-copyright">
                        © 2026 WorkflowEngine Inc. All rights reserved.
                    </p>
                    <div className="footer-social">
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                            <FaTwitter />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <FaLinkedin />
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                            <FaGithub />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
