import { HiOutlineExclamationCircle, HiArrowRight } from 'react-icons/hi';
import './RiskBanner.css';

export default function RiskBanner({ overdueCount }) {
    if (!overdueCount || overdueCount <= 0) return null;

    const severity = overdueCount > 5 ? 'critical' : 'warning';

    return (
        <div className={`risk-banner risk-banner-${severity}`}>
            <div className="risk-banner-content">
                <div className="risk-icon-wrapper">
                    <HiOutlineExclamationCircle className="risk-icon" />
                </div>
                <div className="risk-message">
                    <h3 className="risk-title">Attention Required</h3>
                    <p className="risk-description">
                        You have <span className="risk-count">{overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</span> requiring immediate attention.
                    </p>
                </div>
            </div>
            <button className="risk-action-btn">
                View Tasks <HiArrowRight />
            </button>
        </div>
    );
}
