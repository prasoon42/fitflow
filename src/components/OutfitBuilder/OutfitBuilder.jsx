import { useState } from 'react';
import { useWardrobe } from '../../context/WardrobeContext';
import './OutfitBuilder.css';

const builderCategories = ['Upperwear', 'Lowerwear', 'Shoes', 'Accessories'];

// Inline SVG icons
const SparklesIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4l-6.4 4.8L8 14l-6-4.8h7.6z" />
    </svg>
);
const HeartIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
);

function OutfitBuilder() {
    const { wardrobeItems, saveOutfit } = useWardrobe();
    const [selected, setSelected] = useState({});
    const [outfitName, setOutfitName] = useState('');
    const [saved, setSaved] = useState(false);

    const availableItems = wardrobeItems.filter(i => i.status === 'available');

    const toggleItem = (category, item) => {
        setSelected(prev => {
            if (prev[category]?.id === item.id) {
                const next = { ...prev };
                delete next[category];
                return next;
            }
            return { ...prev, [category]: item };
        });
    };

    const handleSaveOutfit = () => {
        const items = Object.values(selected);
        if (items.length === 0) return;
        saveOutfit({
            name: outfitName || `Outfit ${Date.now().toString(36)}`,
            items,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setSelected({});
        setOutfitName('');
    };

    const handleGenerateSuggestion = () => {
        const suggestion = {};
        builderCategories.forEach(cat => {
            const catItems = availableItems.filter(i => i.category === cat);
            if (catItems.length > 0) {
                suggestion[cat] = catItems[Math.floor(Math.random() * catItems.length)];
            }
        });
        setSelected(suggestion);
    };

    const selectedItems = Object.entries(selected);

    return (
        <div className="outfit-builder">
            <div className="panel-header">
                <h1 className="panel-header__title">Outfit Builder</h1>
                <p className="panel-header__subtitle">Mix and match items from your wardrobe</p>
            </div>

            <div className="outfit-builder__sections">
                {builderCategories.map(category => {
                    const items = availableItems.filter(i => i.category === category);
                    return (
                        <div key={category} className="card outfit-section">
                            <div className="outfit-section__title">{category}</div>
                            {items.length === 0 ? (
                                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                    No available items
                                </div>
                            ) : (
                                <div className="outfit-section__items">
                                    {items.map(item => (
                                        <button
                                            key={item.id}
                                            className={`outfit-item-option ${selected[category]?.id === item.id ? 'outfit-item-option--selected' : ''}`}
                                            onClick={() => toggleItem(category, item)}
                                            title={item.name}
                                        >
                                            <img src={item.image} alt={item.name} className="outfit-item-option__img" loading="lazy" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="card outfit-preview">
                <div className="outfit-preview__title">Outfit Preview</div>
                {selectedItems.length === 0 ? (
                    <div className="outfit-preview__empty">Select items above to preview your outfit</div>
                ) : (
                    <div className="outfit-preview__items">
                        {selectedItems.map(([category, item]) => (
                            <div key={category} className="outfit-preview__item">
                                <img src={item.image} alt={item.name} className="outfit-preview__item-img" />
                                <span className="outfit-preview__item-label">{category}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="outfit-name-input">
                <label className="label" htmlFor="outfit-name">Outfit Name</label>
                <input
                    id="outfit-name"
                    className="input"
                    placeholder="Give your outfit a name..."
                    value={outfitName}
                    onChange={e => setOutfitName(e.target.value)}
                    style={{ maxWidth: 360 }}
                />
            </div>

            <div className="outfit-actions">
                <button className="btn btn--secondary" onClick={handleGenerateSuggestion} id="generate-suggestion-btn">
                    <SparklesIcon /> Generate Suggestions
                </button>
                <button
                    className="btn btn--primary"
                    onClick={handleSaveOutfit}
                    disabled={selectedItems.length === 0}
                    id="save-outfit-btn"
                >
                    <HeartIcon /> Save Outfit to Favourites
                </button>
            </div>

            {saved && (
                <div className="save-toast">✓ Outfit saved to Favourites</div>
            )}
        </div>
    );
}

export default OutfitBuilder;
