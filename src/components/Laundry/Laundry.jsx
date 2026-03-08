import { useWardrobe } from '../../context/WardrobeContext';
import './Laundry.css';

// Inline SVG icons
const CheckIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const ReturnIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 105.64-11.36L1 10" />
    </svg>
);

function Laundry() {
    const { wardrobeItems, returnFromLaundry, getAvailableItems } = useWardrobe();

    const laundryItems = wardrobeItems.filter(item => item.status === 'laundry');
    const availableCount = getAvailableItems().length;

    return (
        <div className="laundry-panel">
            <div className="panel-header">
                <h1 className="panel-header__title">Laundry</h1>
                <p className="panel-header__subtitle">Track clothes in the wash</p>
            </div>

            <div className="laundry-stats">
                <div className="card laundry-stat">
                    <span className="laundry-stat__value">{laundryItems.length}</span>
                    <span className="laundry-stat__label">In Laundry</span>
                </div>
                <div className="card laundry-stat">
                    <span className="laundry-stat__value">{availableCount}</span>
                    <span className="laundry-stat__label">Available</span>
                </div>
            </div>

            {laundryItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                            <circle cx="12" cy="13" r="8" /><circle cx="12" cy="13" r="3" /><path d="M5 3h14" />
                        </svg>
                    </div>
                    <div className="empty-state__text">No items in laundry</div>
                    <div className="empty-state__subtext">Move items from your wardrobe to track them here</div>
                </div>
            ) : (
                <div className="items-grid">
                    {laundryItems.map(item => (
                        <div key={item.id} className="card clothing-card">
                            <div className="clothing-card__image-wrap">
                                <img src={item.image} alt={item.name} className="clothing-card__image" loading="lazy" />
                                <span className="tag tag--laundry clothing-card__status">In Laundry</span>
                            </div>
                            <div className="clothing-card__body">
                                <div className="clothing-card__name">{item.name}</div>
                                <span className="tag tag--category clothing-card__category">{item.category}</span>
                                <div className="laundry-card__actions">
                                    <button
                                        className="btn btn--sm btn--success"
                                        onClick={() => returnFromLaundry(item.id)}
                                    >
                                        <CheckIcon /> Mark as Washed
                                    </button>
                                    <button
                                        className="btn btn--sm btn--secondary"
                                        onClick={() => returnFromLaundry(item.id)}
                                    >
                                        <ReturnIcon /> Return
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Laundry;
