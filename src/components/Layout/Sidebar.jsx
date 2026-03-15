import './Sidebar.css';

// Minimal SVG icons - monochrome, stroke-based
const icons = {
    profile: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
        </svg>
    ),
    wardrobe: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
            <path d="M9 8h-2" />
            <path d="M17 8h-2" />
        </svg>
    ),
    outfitBuilder: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    laundry: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="13" r="8" />
            <circle cx="12" cy="13" r="3" />
            <path d="M5 3h14" />
            <circle cx="8" cy="3" r="0.5" fill="currentColor" />
        </svg>
    ),
    shopping: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
        </svg>
    ),
    favourites: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#f7b1ab" stroke="#f7b1ab" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
    ),
};

const navItems = [
    { id: 'profile', label: 'Profile', icon: icons.profile },
    { id: 'wardrobe', label: 'Wardrobe', icon: icons.wardrobe },
    { id: 'outfit-builder', label: 'Outfit Builder', icon: icons.outfitBuilder },
    { id: 'laundry', label: 'Laundry', icon: icons.laundry },
    { id: 'shopping', label: 'Shopping Suggestions', icon: icons.shopping },
    { id: 'favourites', label: 'Favourites', icon: icons.favourites },
];

function Sidebar({ activePanel, onPanelChange }) {
    return (
        <nav className="sidebar" role="navigation" aria-label="Main navigation">
            <div className="sidebar__section-label">Menu</div>
            {navItems.map(item => (
                <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    className={`sidebar__item ${activePanel === item.id ? 'sidebar__item--active' : ''}`}
                    onClick={() => onPanelChange(item.id)}
                >
                    <span className="sidebar__icon">{item.icon}</span>
                    <span className="sidebar__label">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}

export default Sidebar;
