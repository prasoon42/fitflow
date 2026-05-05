import React, { useRef } from 'react';
import './LandingPage.css';
import LoginRegister from '../Auth/LoginRegister';

function LandingPage({ showAuth, onLogin, onBackToHome }) {
    const containerRef = useRef(null);

    const handleBackToTop = (e) => {
        e.preventDefault();
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFeaturesClick = (e) => {
        if (showAuth && onBackToHome) {
            onBackToHome();
            setTimeout(() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    };

    return (
        <div className="landing-container" ref={containerRef}>
            {/* Navigation Bar */}
            <nav className="landing-nav">
                <div className="landing-nav-left">
                    <div className="landing-logo">
                        <svg className="landing-logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 4H8L4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 10H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Fit<span style={{ color: '#ff0055' }}>Flow</span>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features" className="landing-nav-link" onClick={handleFeaturesClick}>Features</a>
                    </div>
                </div>
                <div className="landing-nav-actions">
                    {!showAuth && <button className="landing-nav-login" onClick={onLogin}>Sign Up</button>}
                </div>
            </nav>

            {showAuth ? (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                    <LoginRegister onBackToHome={onBackToHome} />
                </div>
            ) : (
                <>
                    {/* Hero Section */}
                    <main className="landing-hero">
                        <div className="landing-hero-badge">
                            <span className="badge-icon">✨</span>
                            Virtual Wardrobe AI Evolved
                        </div>
                        
                        <h1 className="landing-hero-title">
                            Manage Your Wardrobe Like<br/>
                            <span className="landing-hero-highlight">Never Before</span>
                        </h1>
                        
                        <p className="landing-hero-subtitle">
                            All-in-one platform for your digital closet. AI-powered outfits, background removal, and smart recommendations to streamline your style.
                        </p>
                        
                        <div className="landing-hero-buttons">
                            <button className="landing-hero-cta" onClick={onLogin}>
                                Log In <span className="arrow">→</span>
                            </button>
                        </div>
                    </main>

                    {/* Features Section */}
                    <section className="landing-features" id="features">
                        <h2 className="landing-features-title">
                            Everything you need to<br/>
                            <span className="landing-features-highlight">run a world-class digital closet</span>
                        </h2>
                        <p className="landing-features-subtitle">
                            Powerful features designed to organize and elevate your personal style.
                        </p>

                        <div className="landing-features-grid">
                            <div className="landing-feature-card">
                                <div className="feature-icon-wrapper">
                                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                </div>
                                <h3>AI Recommendations</h3>
                                <p>Get smart outfit suggestions based on your personal style and occasions.</p>
                            </div>
                            <div className="landing-feature-card">
                                <div className="feature-icon-wrapper">
                                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="14.31" y1="8" x2="20.05" y2="17.94"></line><line x1="9.69" y1="8" x2="21.17" y2="8"></line><line x1="7.38" y1="12" x2="13.12" y2="2.06"></line><line x1="9.69" y1="16" x2="3.95" y2="6.06"></line><line x1="14.31" y1="16" x2="2.83" y2="16"></line><line x1="16.62" y1="12" x2="10.88" y2="21.94"></line></svg>
                                </div>
                                <h3>Background Removal</h3>
                                <p>Automatically extract your clothes from photos for a clean, organized look.</p>
                            </div>
                            <div className="landing-feature-card">
                                <div className="feature-icon-wrapper">
                                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                                </div>
                                <h3>Wardrobe Organization</h3>
                                <p>Easily categorize and manage your tops, bottoms, shoes, and accessories.</p>
                            </div>
                            <div className="landing-feature-card">
                                <div className="feature-icon-wrapper">
                                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                                </div>
                                <h3>Outfit Builder</h3>
                                <p>Mix and match pieces on a virtual canvas to plan your perfect looks.</p>
                            </div>
                        </div>
                        
                        <div style={{ marginTop: '4rem' }}>
                            <button onClick={handleBackToTop} className="landing-hero-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                                ↑ Back to Top
                            </button>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

export default LandingPage;
