import PublicNavbar from './PublicNavbar';
import Footer from './Footer';

export default function PublicLayout({ children }) {
    return (
        <div className="public-layout">
            <PublicNavbar />
            <main className="public-content">
                {children}
            </main>
            <Footer />
        </div>
    );
}
