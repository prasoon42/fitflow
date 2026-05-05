import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

function TopBar() {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    return (
        <header className="topbar">
            <div className="topbar__brand">
                <svg className="topbar__logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '28px', height: '28px', color: 'var(--accent)' }}>
                    <path d="M16 4H8L4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 10H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Fit<span style={{ color: 'var(--accent)' }}>Flow</span>
            </div>
            <div className="topbar__right">
                <div className="topbar__user">Hi, {user?.name || 'User'}</div>
                <button
                    type="button"
                    className="btn btn--secondary btn--sm topbar__logout"
                    onClick={() => logout()}
                    id="logout-btn"
                >
                    Log out
                </button>
                <button
                    className={`theme-toggle ${theme === 'dark' ? 'theme-toggle--dark' : ''}`}
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    id="theme-toggle-btn"
                >
                    <div className="theme-toggle__slider">
                        {theme === 'light' ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                            </svg>
                        )}
                    </div>
                </button>
            </div>
        </header>
    );
}

export default TopBar;
