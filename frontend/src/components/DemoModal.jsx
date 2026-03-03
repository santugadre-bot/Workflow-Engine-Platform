import { useState, useEffect, useRef } from 'react';
import { HiOutlineX } from 'react-icons/hi';

export default function DemoModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        company: '',
        teamSize: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const overlayRef = useRef(null);
    const firstInputRef = useRef(null);

    // Focus trap — move focus into modal on open
    useEffect(() => {
        if (isOpen && firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ fullName: '', email: '', company: '', teamSize: '', message: '' });
            onClose();
        }, 2400);
    };

    if (!isOpen) return null;

    return (
        <div
            className="demo-modal-overlay"
            ref={overlayRef}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
        >
            <div className="demo-modal">
                {/* Close button */}
                <button
                    className="demo-modal-close"
                    onClick={onClose}
                    aria-label="Close demo request form"
                >
                    <HiOutlineX />
                </button>

                {submitted ? (
                    <div className="demo-modal-success">
                        <div className="demo-success-icon">✓</div>
                        <h3 id="demo-modal-title">Request Received</h3>
                        <p>Our enterprise team will reach out within 24 hours.</p>
                    </div>
                ) : (
                    <>
                        <div className="demo-modal-header">
                            <span className="section-tag" style={{ marginBottom: '8px' }}>Enterprise Demo</span>
                            <h3 id="demo-modal-title">Book a Personalized Demo</h3>
                            <p className="demo-modal-desc">
                                See how WorkflowEngine can transform your operations. Our team will prepare a custom walkthrough for your organization.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="demo-modal-form">
                            <div className="input-group">
                                <label htmlFor="demo-fullName">Full Name</label>
                                <input
                                    ref={firstInputRef}
                                    id="demo-fullName"
                                    name="fullName"
                                    type="text"
                                    className="input"
                                    placeholder="Jane Doe"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    autoComplete="name"
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="demo-email">Work Email</label>
                                <input
                                    id="demo-email"
                                    name="email"
                                    type="email"
                                    className="input"
                                    placeholder="jane@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="demo-modal-row">
                                <div className="input-group">
                                    <label htmlFor="demo-company">Company</label>
                                    <input
                                        id="demo-company"
                                        name="company"
                                        type="text"
                                        className="input"
                                        placeholder="Acme Corp"
                                        value={formData.company}
                                        onChange={handleChange}
                                        required
                                        autoComplete="organization"
                                    />
                                </div>
                                <div className="input-group">
                                    <label htmlFor="demo-teamSize">Team Size</label>
                                    <select
                                        id="demo-teamSize"
                                        name="teamSize"
                                        className="input"
                                        value={formData.teamSize}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select…</option>
                                        <option value="1-10">1 – 10</option>
                                        <option value="11-50">11 – 50</option>
                                        <option value="51-200">51 – 200</option>
                                        <option value="201-1000">201 – 1,000</option>
                                        <option value="1000+">1,000+</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <label htmlFor="demo-message">What are you looking to solve?</label>
                                <textarea
                                    id="demo-message"
                                    name="message"
                                    className="input"
                                    placeholder="Tell us about your workflow challenges…"
                                    rows={3}
                                    value={formData.message}
                                    onChange={handleChange}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center' }}>
                                Request Enterprise Demo
                            </button>

                            <p className="demo-modal-privacy">
                                By submitting, you agree to our Privacy Policy. We'll never share your data.
                            </p>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
