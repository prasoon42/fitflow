import { useState } from 'react';
import { mockShoppingProducts } from '../../data/mockData';
import './ShoppingSuggestions.css';

// Category → search keyword mapping for better results on Indian sites
const CATEGORY_SEARCH_TERMS = {
    Upperwear: 'men shirts tshirts tops',
    Lowerwear: 'men jeans trousers pants',
    Shoes: 'men shoes footwear sneakers',
    Accessories: 'men accessories',
    Outerwear: 'men jackets coats outerwear',
};

// Generate buy links with a specific max price filter
function generateBuyLinks(productName, category, maxPrice) {
    const categoryHint = CATEGORY_SEARCH_TERMS[category] || '';
    const searchTerm = `${productName} ${categoryHint}`.trim();
    const encoded = encodeURIComponent(searchTerm);

    return {
        Myntra: `https://www.myntra.com/${encodeURIComponent(productName.replace(/\s+/g, '-'))}?f=price:Rs.%20100%20to%20Rs.%20${maxPrice}`,
        Flipkart: `https://www.flipkart.com/search?q=${encoded}&p[]=facets.price_range.from%3D100&p[]=facets.price_range.to%3D${maxPrice}`,
        AJIO: `https://www.ajio.com/search/?text=${encoded}&priceRange=100-${maxPrice}`,
    };
}

function ShoppingSuggestions() {
    const [globalBudget, setGlobalBudget] = useState(5000);
    const [wishlist, setWishlist] = useState([]);
    // Per-item budget sliders: { [productId]: sliderValue }
    const [itemBudgets, setItemBudgets] = useState({});

    const filteredProducts = mockShoppingProducts.filter(p => p.price <= globalBudget);

    const toggleWishlist = (id) => {
        setWishlist(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getItemBudget = (productId, defaultPrice) => {
        return itemBudgets[productId] ?? Math.min(defaultPrice + 1000, 10000);
    };

    const setItemBudget = (productId, value) => {
        setItemBudgets(prev => ({ ...prev, [productId]: value }));
    };

    return (
        <div className="shopping-panel">
            <div className="panel-header">
                <h1 className="panel-header__title">Shopping Suggestions</h1>
                <p className="panel-header__subtitle">Discover pieces that match your style and budget</p>
            </div>

            <div className="card budget-slider">
                <div className="budget-slider__header">
                    <span className="budget-slider__title">Show Items Under</span>
                    <span className="budget-slider__value">₹{globalBudget.toLocaleString('en-IN')}</span>
                </div>
                <input
                    type="range"
                    className="budget-slider__input"
                    min="500"
                    max="10000"
                    step="100"
                    value={globalBudget}
                    onChange={e => setGlobalBudget(Number(e.target.value))}
                    id="budget-slider"
                />
                <div className="budget-slider__range">
                    <span>₹500</span>
                    <span>₹10,000</span>
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
                    {filteredProducts.map(product => {
                        const currentItemBudget = getItemBudget(product.id, product.price);
                        const buyLinks = generateBuyLinks(product.name, product.category, currentItemBudget);
                        return (
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
                                        <span className="product-card__price">₹{product.price.toLocaleString('en-IN')}</span>
                                        <button
                                            className={`wishlist-btn ${wishlist.includes(product.id) ? 'wishlist-btn--added' : ''}`}
                                            onClick={() => toggleWishlist(product.id)}
                                        >
                                            {wishlist.includes(product.id) ? '♥' : '♡'}
                                        </button>
                                    </div>
                                    <span className="tag tag--category">{product.category}</span>

                                    {/* Per-item budget slider */}
                                    <div className="item-budget-slider">
                                        <div className="item-budget-slider__header">
                                            <span className="item-budget-slider__label">Search budget</span>
                                            <span className="item-budget-slider__value">₹{currentItemBudget.toLocaleString('en-IN')}</span>
                                        </div>
                                        <input
                                            type="range"
                                            className="item-budget-slider__input"
                                            min="200"
                                            max="10000"
                                            step="100"
                                            value={currentItemBudget}
                                            onChange={e => setItemBudget(product.id, Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="product-card__buy-links">
                                        {Object.entries(buyLinks).map(([platform, url]) => (
                                            <a
                                                key={platform}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="buy-link-chip"
                                                title={`Search on ${platform} (under ₹${currentItemBudget.toLocaleString('en-IN')})`}
                                            >
                                                {platform}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ShoppingSuggestions;
