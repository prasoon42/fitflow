import { useState } from 'react';
import { mockShoppingProducts } from '../../data/mockData';
import './ShoppingSuggestions.css';

function ShoppingSuggestions() {
    const [budget, setBudget] = useState(100);
    const [wishlist, setWishlist] = useState([]);

    const filteredProducts = mockShoppingProducts.filter(p => p.price <= budget);

    const toggleWishlist = (id) => {
        setWishlist(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="shopping-panel">
            <div className="panel-header">
                <h1 className="panel-header__title">Shopping Suggestions</h1>
                <p className="panel-header__subtitle">Discover pieces that match your style and budget</p>
            </div>

            <div className="card budget-slider">
                <div className="budget-slider__header">
                    <span className="budget-slider__title">Budget Range</span>
                    <span className="budget-slider__value">${budget}</span>
                </div>
                <input
                    type="range"
                    className="budget-slider__input"
                    min="10"
                    max="200"
                    step="5"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    id="budget-slider"
                />
                <div className="budget-slider__range">
                    <span>$10</span>
                    <span>$200</span>
                </div>
            </div>

            <div className="shopping-section-title">
                Suggested Items ({filteredProducts.length})
            </div>

            {filteredProducts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
                        </svg>
                    </div>
                    <div className="empty-state__text">No items in this budget range</div>
                    <div className="empty-state__subtext">Try increasing your budget</div>
                </div>
            ) : (
                <div className="items-grid">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="card product-card">
                            <div className="product-card__image-wrap">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="product-card__image"
                                    loading="lazy"
                                />
                            </div>
                            <div className="product-card__body">
                                <div className="product-card__name">{product.name}</div>
                                <div className="product-card__footer">
                                    <span className="product-card__price">${product.price.toFixed(2)}</span>
                                    <button
                                        className={`wishlist-btn ${wishlist.includes(product.id) ? 'wishlist-btn--added' : ''}`}
                                        onClick={() => toggleWishlist(product.id)}
                                    >
                                        {wishlist.includes(product.id) ? '♥' : '♡'}
                                    </button>
                                </div>
                                <span className="tag tag--category">{product.category}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ShoppingSuggestions;
