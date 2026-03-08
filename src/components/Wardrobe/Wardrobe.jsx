import { useState } from 'react';
import { useWardrobe } from '../../context/WardrobeContext';
import { clothingCategories } from '../../data/mockData';
import './Wardrobe.css';

// Inline SVG icons matching sidebar style
const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
);
const PlusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const LaundryIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" /><circle cx="12" cy="13" r="3" /><path d="M5 3h14" />
    </svg>
);
const CloseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

function Wardrobe() {
    const {
        wardrobeItems,
        addClothingItem,
        removeClothingItem,
        moveToLaundry,
    } = useWardrobe();

    const [activeCategory, setActiveCategory] = useState('All');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [removeMode, setRemoveMode] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Upperwear',
        notes: '',
        image: '',
    });

    const categories = ['All', ...clothingCategories];

    const filteredItems = wardrobeItems.filter(item => {
        const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
        const statusMatch = statusFilter === 'all' ||
            (statusFilter === 'available' && item.status === 'available') ||
            (statusFilter === 'laundry' && item.status === 'laundry');
        return categoryMatch && statusMatch;
    });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewItem(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddItem = () => {
        if (!newItem.name) return;
        addClothingItem({
            ...newItem,
            image: newItem.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=300&fit=crop',
        });
        setNewItem({ name: '', category: 'Upperwear', notes: '', image: '' });
        setShowAddModal(false);
    };

    const handleCardClick = (id) => {
        if (removeMode) {
            removeClothingItem(id);
        }
    };

    return (
        <div className="wardrobe-panel">
            <div className="panel-header">
                <h1 className="panel-header__title">Wardrobe</h1>
                <p className="panel-header__subtitle">
                    Your digital closet — {wardrobeItems.length} items
                </p>
            </div>

            <div className="toolbar">
                <button
                    className="btn btn--primary"
                    onClick={() => setShowAddModal(true)}
                    id="add-clothing-btn"
                >
                    <PlusIcon /> Add Clothing Item
                </button>
                <button
                    className={`btn ${removeMode ? 'btn--danger' : 'btn--secondary'}`}
                    onClick={() => setRemoveMode(!removeMode)}
                    id="remove-clothing-btn"
                >
                    {removeMode ? <><CloseIcon /> Cancel Remove</> : <><TrashIcon /> Remove Item</>}
                </button>

                <div className="toolbar__spacer" />

                <select
                    className="select toolbar__filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    id="status-filter"
                >
                    <option value="all">All Items</option>
                    <option value="available">Available</option>
                    <option value="laundry">In Laundry</option>
                </select>
            </div>

            {removeMode && (
                <div className="remove-mode-hint">
                    Click on an item to remove it from your wardrobe
                </div>
            )}

            <div className="category-tabs">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-tab ${activeCategory === cat ? 'category-tab--active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                            <path d="M20.38 3.46L16 2 12 3.46 8 2 3.62 3.46a1 1 0 00-.62.94V20a1 1 0 001 1h16a1 1 0 001-1V4.4a1 1 0 00-.62-.94z" />
                            <path d="M8 10h8" /><path d="M8 14h4" />
                        </svg>
                    </div>
                    <div className="empty-state__text">No items in this category</div>
                    <div className="empty-state__subtext">Add clothing to get started</div>
                </div>
            ) : (
                <div className="items-grid">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            className={`card clothing-card ${removeMode ? 'clothing-card--remove-mode' : ''}`}
                            onClick={() => handleCardClick(item.id)}
                        >
                            <div className="clothing-card__image-wrap">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="clothing-card__image"
                                    loading="lazy"
                                />
                                <span className={`tag clothing-card__status ${item.status === 'available' ? 'tag--available' : 'tag--laundry'}`}>
                                    {item.status === 'available' ? 'Available' : 'In Laundry'}
                                </span>
                            </div>
                            <div className="clothing-card__body">
                                <div className="clothing-card__name">{item.name}</div>
                                <span className="tag tag--category clothing-card__category">{item.category}</span>
                                {!removeMode && item.status === 'available' && (
                                    <div className="clothing-card__actions">
                                        <button
                                            className="btn btn--sm btn--secondary"
                                            onClick={(e) => { e.stopPropagation(); moveToLaundry(item.id); }}
                                        >
                                            <LaundryIcon /> To Laundry
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Clothing Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Add Clothing Item</h2>
                            <button className="modal__close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div className="modal__body">
                            <div>
                                <label className="label">Image</label>
                                {newItem.image ? (
                                    <div className="image-upload" onClick={() => setNewItem(prev => ({ ...prev, image: '' }))}>
                                        <img src={newItem.image} alt="Preview" className="image-upload__preview" />
                                        <span className="image-upload__text">Click to change</span>
                                    </div>
                                ) : (
                                    <label className="image-upload">
                                        <span className="image-upload__icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        </span>
                                        <span className="image-upload__text">Click to upload image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                )}
                            </div>
                            <div>
                                <label className="label" htmlFor="item-name">Name</label>
                                <input
                                    id="item-name"
                                    className="input"
                                    placeholder="e.g. Blue Oxford Shirt"
                                    value={newItem.name}
                                    onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="label" htmlFor="item-category">Category</label>
                                <select
                                    id="item-category"
                                    className="select"
                                    value={newItem.category}
                                    onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                                >
                                    {clothingCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label" htmlFor="item-notes">Notes (optional)</label>
                                <input
                                    id="item-notes"
                                    className="input"
                                    placeholder="Any special notes..."
                                    value={newItem.notes}
                                    onChange={e => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleAddItem} id="confirm-add-btn">Add Item</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Wardrobe;
