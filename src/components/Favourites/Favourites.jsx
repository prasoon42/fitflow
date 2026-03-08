import { useWardrobe } from '../../context/WardrobeContext';
import './Favourites.css';

// Inline SVG icons
const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

function Favourites() {
    const { favouriteOutfits, removeOutfit } = useWardrobe();

    return (
        <div className="favourites-panel">
            <div className="panel-header">
                <h1 className="panel-header__title">Favourites</h1>
                <p className="panel-header__subtitle">
                    Your saved outfits — {favouriteOutfits.length} {favouriteOutfits.length === 1 ? 'outfit' : 'outfits'}
                </p>
            </div>

            {favouriteOutfits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                        </svg>
                    </div>
                    <div className="empty-state__text">No saved outfits yet</div>
                    <div className="empty-state__subtext">Build and save outfits from the Outfit Builder</div>
                </div>
            ) : (
                <div className="favourites-grid">
                    {favouriteOutfits.map(outfit => (
                        <div key={outfit.id} className="card outfit-fav-card">
                            <div className="outfit-fav-card__header">
                                <span className="outfit-fav-card__name">{outfit.name}</span>
                                <button
                                    className="btn btn--sm btn--danger"
                                    onClick={() => removeOutfit(outfit.id)}
                                >
                                    <CloseIcon /> Remove
                                </button>
                            </div>
                            <div className="outfit-fav-card__items">
                                {outfit.items.map(item => (
                                    <div key={item.id} className="outfit-fav-card__item">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="outfit-fav-card__item-img"
                                            loading="lazy"
                                        />
                                        <span className="outfit-fav-card__item-label">{item.category}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Favourites;
