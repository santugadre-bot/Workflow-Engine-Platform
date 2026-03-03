import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineMenu, HiOutlineX, HiOutlineArrowRight } from 'react-icons/hi';

export default function PublicNavbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="modern-navbar">
            <div className="landing-container navbar-inner">
                {/* Logo */}
                <Link to="/" className="navbar-logo-link">
                    <HiOutlineLightningBolt className="navbar-logo-icon" />
                    <span className="navbar-logo-text">WorkflowEngine</span>
                </Link>

                {/* Desktop Navigation */}
                <div className="navbar-desktop-links">
                    <a href="#features" className="navbar-link">Features</a>
                    <a href="#pricing" className="navbar-link">Pricing</a>
                    <a href="#testimonials" className="navbar-link">Customers</a>
                    <a href="#faq" className="navbar-link">Docs</a>
                </div>

                {/* Desktop CTAs */}
                <div className="navbar-desktop-ctas">
                    <Link to="/login" className="navbar-login">Login</Link>
                    <Link to="/register" className="navbar-cta-btn">
                        Get Started Free
                        <HiOutlineArrowRight />
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="navbar-mobile-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <HiOutlineX /> : <HiOutlineMenu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="navbar-mobile-menu">
                    <div className="navbar-mobile-links">
                        <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                        <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                        <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Customers</a>
                        <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>Docs</a>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    </div>
                    <div className="navbar-mobile-cta">
                        <Link to="/register" className="navbar-cta-btn" onClick={() => setIsMobileMenuOpen(false)}>
                            Get Started Free
                            <HiOutlineArrowRight />
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
