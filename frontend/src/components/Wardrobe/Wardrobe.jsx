import { useState } from 'react';
import { useWardrobe } from '../../context/WardrobeContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';
import { clothingCategories } from '../../data/mockData';
import { getWardrobeBroadGroup, matchesWardrobeTab } from '../../utils/wardrobeCategories';
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

const scoreDetection = (item) => {
    const confidence = Number(item?.confidence || 0);
    const bbox = item?.bbox || [];
    if (!Array.isArray(bbox) || bbox.length !== 4) return confidence;
    const [x1, y1, x2, y2] = bbox;
    const area = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    // Prefer confident detections, but down-rank tiny boxes.
    return confidence * Math.sqrt(area || 1);
};

const modelClassOptions = [
    'blazer', 'cardigan', 'dress', 'formal_shirt', 'hoodie', 'jeans',
    'longsleeve', 'pullover', 'shorts', 'skirt', 'sweaters', 'sweatshirt',
    't-shirt', 'top', 'trousers', 'vest', 'boot', 'casual', 'heel',
    'slide', 'sneaker', 'sport'
];

/** Map wardrobe tab labels to a plausible model class for manual add-with-image. */
const broadToModelClass = (broad) => {
    const map = {
        Upperwear: 't-shirt',
        Lowerwear: 'jeans',
        Shoes: 'sneaker',
        Accessories: 'top',
        Outerwear: 'blazer',
    };
    return map[broad] || 't-shirt';
};

const getDaysSinceWashedLabel = (item) => {
    const source = item?.lastWashedAt || item?.createdAt;
    if (!source) return 'Wash info unavailable';
    const parsed = new Date(source);
    if (Number.isNaN(parsed.getTime())) return 'Wash info unavailable';
    const days = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
    if (days === 0) return 'Washed today';
    if (days === 1) return '1 day since washed';
    return `${days} days since washed`;
};

function Wardrobe() {
    const {
        wardrobeItems,
        addClothingItem,
        removeClothingItem,
        moveToLaundry,
        busyIds,
        loadingWardrobe,
    } = useWardrobe();

    const [activeCategory, setActiveCategory] = useState('All');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetectionModal, setShowDetectionModal] = useState(false);
    const [detectionChoices, setDetectionChoices] = useState([]);
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');
    const [isSavingDetection, setIsSavingDetection] = useState(false);
    const [uploadNotice, setUploadNotice] = useState('');
    const [manualCategory, setManualCategory] = useState('t-shirt');
    const [manualColor, setManualColor] = useState('black');
    const [removeMode, setRemoveMode] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [isSavingManualAdd, setIsSavingManualAdd] = useState(false);
    const [showManualFieldsAfterUpload, setShowManualFieldsAfterUpload] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        category: 'Upperwear',
        notes: '',
        image: '',
        file: null,
    });
    
    const { token } = useAuth();

    const detectedCategories = [...new Set(wardrobeItems.map(item => item.category).filter(Boolean))];
    const categories = ['All', ...new Set([...clothingCategories, ...detectedCategories])];

    const filteredItems = wardrobeItems.filter(item => {
        const categoryMatch = matchesWardrobeTab(item, activeCategory);
        const statusMatch = statusFilter === 'all' ||
            (statusFilter === 'available' && item.status === 'available') ||
            (statusFilter === 'laundry' && item.status === 'laundry');
        return categoryMatch && statusMatch;
    });

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setShowManualFieldsAfterUpload(false);
            setNewItem(prev => ({ ...prev, file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewItem(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDetectClothing = async () => {
        if (!newItem.file) return;
        setUploadNotice('');
        setIsDetecting(true);
        try {
            const formData = new FormData();
            formData.append('file', newItem.file);

            const runUpload = async (target) => fetch(`${API_BASE}/upload?target=${target}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            let res = await runUpload('upper');
            if (!res.ok) throw new Error('Upper-target detection request failed');
            let data = await res.json();

            if (!data.detected || data.detected.length === 0) {
                res = await runUpload('auto');
                if (!res.ok) throw new Error('Auto-target detection request failed');
                data = await res.json();
                if (data.detected && data.detected.length > 0) {
                    setUploadNotice('No upper-body item found. Showing best overall detections.');
                }
            }

            if (data.detected && data.detected.length > 0) {
                const sorted = [...data.detected]
                    .sort((a, b) => scoreDetection(b) - scoreDetection(a))
                    .slice(0, 3);
                setDetectionChoices(sorted);
                setManualCategory(sorted[0]?.category || 't-shirt');
                setManualColor(sorted[0]?.color || 'black');
                setUploadedImageUrl(data.image_url || newItem.image || '');
                setShowDetectionModal(true);
                setShowAddModal(false);
                setShowManualFieldsAfterUpload(false);
                return;
            }

            setUploadNotice('No confident detection found. Try a clearer, closer image.');
        } catch (err) {
            console.error('Clothing detection failed', err);
            setUploadNotice('Detection failed. Please try again.');
        } finally {
            setIsDetecting(false);
        }
    };

    const handleManualSaveWithImage = async () => {
        if (!newItem.file) return;
        setUploadNotice('');
        setIsSavingManualAdd(true);
        try {
            const formData = new FormData();
            formData.append('file', newItem.file);
            const res = await fetch(`${API_BASE}/upload?target=auto`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            const imageUrl = data.image_url;
            const modelCat = broadToModelClass(newItem.category);
            const displayName = (newItem.name && newItem.name.trim()) || `${newItem.category} item`;

            const res2 = await fetch(`${API_BASE}/wardrobe/add-detected`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: modelCat,
                    color: 'black',
                    display_name: displayName,
                    confidence: null,
                    bbox: null,
                    image_url: imageUrl
                })
            });
            if (!res2.ok) throw new Error('Save failed');
            const saved = await res2.json();
            const savedItem = saved.item;
            addClothingItem({
                id: savedItem._id,
                name: savedItem.display_name || savedItem.category,
                category: savedItem.category,
                color: savedItem.color,
                image: savedItem.image,
                status: savedItem.status,
                lastWashedAt: savedItem.last_washed_at || null,
                createdAt: savedItem.created_at || null,
            });
            setNewItem({ name: '', category: 'Upperwear', notes: '', image: '', file: null });
            setShowManualFieldsAfterUpload(false);
            setShowAddModal(false);
        } catch (err) {
            console.error('Manual save with image failed', err);
            setUploadNotice('Could not save item. Please try again.');
        } finally {
            setIsSavingManualAdd(false);
        }
    };

    const handleAddItem = async () => {
        setUploadNotice('');

        if (newItem.file && showManualFieldsAfterUpload) {
            await handleManualSaveWithImage();
            return;
        }

        if (newItem.file && !showManualFieldsAfterUpload) {
            return;
        }

        if (!newItem.name && !newItem.file) return;

        addClothingItem({
            ...newItem,
            image: newItem.image || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&h=300&fit=crop',
        });
        setNewItem({ name: '', category: 'Upperwear', notes: '', image: '', file: null });
        setShowManualFieldsAfterUpload(false);
        setShowAddModal(false);
    };

    const handleSelectDetection = async (item) => {
        setIsSavingDetection(true);
        try {
            const res = await fetch(`${API_BASE}/wardrobe/add-detected`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: item.category,
                    color: item.color,
                    display_name: item.display_name,
                    confidence: item.confidence,
                    bbox: item.bbox,
                    image_url: uploadedImageUrl
                })
            });

            if (!res.ok) throw new Error('Failed to save selected detection');
            const data = await res.json();
            const savedItem = data.item;

            addClothingItem({
                id: savedItem._id,
                name: savedItem.display_name || savedItem.category,
                category: savedItem.category,
                color: savedItem.color,
                image: savedItem.image,
                status: savedItem.status,
                lastWashedAt: savedItem.last_washed_at || null,
                createdAt: savedItem.created_at || null,
            });
        } catch (err) {
            console.error('Failed to save selected detection', err);
        } finally {
            setIsSavingDetection(false);
            setShowDetectionModal(false);
            setDetectionChoices([]);
            setUploadedImageUrl('');
            setNewItem({ name: '', category: 'Upperwear', notes: '', image: '', file: null });
        }
    };

    const handleManualOverrideSave = async () => {
        if (!uploadedImageUrl) return;
        await handleSelectDetection({
            category: manualCategory,
            color: manualColor,
            display_name: `${manualColor} ${manualCategory}`,
            confidence: null,
            bbox: null
        });
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
                    onClick={() => {
                        setUploadNotice('');
                        setShowManualFieldsAfterUpload(false);
                        setShowAddModal(true);
                    }}
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

            {loadingWardrobe ? (
                <div className="empty-state">
                    <div className="empty-state__text">Loading wardrobe...</div>
                </div>
            ) : filteredItems.length === 0 ? (
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
                                {statusFilter === 'all' && (
                                    <span className={`clothing-card__status-icon ${item.status === 'available' ? 'status-icon--available' : 'status-icon--laundry'}`} title={item.status === 'available' ? 'Available' : 'In Laundry'}>
                                        {item.status === 'available' ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><circle cx="12" cy="13" r="3" /><path d="M5 3h14" /></svg>
                                        )}
                                    </span>
                                )}
                            </div>
                            <div className="clothing-card__body">
                                <div className="clothing-card__wash-age">{getDaysSinceWashedLabel(item)}</div>
                                <div className="clothing-card__name">{item.name}</div>
                                <div className="clothing-card__meta-row">
                                    <span className="tag tag--category clothing-card__category">{item.category}</span>
                                    <span className="clothing-card__group" title="Closet section">
                                        {getWardrobeBroadGroup(item.category)}
                                    </span>
                                </div>
                                {!removeMode && item.status === 'available' && (
                                    <div className="clothing-card__actions">
                                        <button
                                            className="btn btn--sm btn--secondary"
                                            onClick={(e) => { e.stopPropagation(); moveToLaundry(item.id); }}
                                            disabled={busyIds.has(item.id)}
                                        >
                                            <LaundryIcon /> {busyIds.has(item.id) ? 'Updating...' : 'To Laundry'}
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
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setShowAddModal(false);
                        setShowManualFieldsAfterUpload(false);
                    }}
                >
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Add Clothing Item</h2>
                            <button
                                className="modal__close"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowManualFieldsAfterUpload(false);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal__body">
                            {uploadNotice && <p className="detection-help-text">{uploadNotice}</p>}
                            <div>
                                <label className="label">Image</label>
                                {newItem.image ? (
                                    <div
                                        className="image-upload"
                                        onClick={() => {
                                            setNewItem(prev => ({ ...prev, image: '', file: null }));
                                            setShowManualFieldsAfterUpload(false);
                                            setUploadNotice('');
                                        }}
                                    >
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

                            {newItem.image && !showManualFieldsAfterUpload && (
                                <div className="add-modal__post-upload">
                                    <p className="add-modal__post-upload-hint">Detect the garment in your photo to set category and color.</p>
                                    <button
                                        type="button"
                                        className="btn btn--primary add-modal__detect-btn"
                                        onClick={handleDetectClothing}
                                        disabled={isDetecting || isSavingManualAdd}
                                        id="detect-clothing-btn"
                                    >
                                        {isDetecting ? 'Detecting…' : 'Detect Clothing'}
                                    </button>
                                    <button
                                        type="button"
                                        className="add-modal__manual-link"
                                        onClick={() => setShowManualFieldsAfterUpload(true)}
                                        disabled={isDetecting || isSavingManualAdd}
                                    >
                                        Enter details manually
                                    </button>
                                </div>
                            )}

                            {(!newItem.image || showManualFieldsAfterUpload) && (
                                <>
                                    <div>
                                        <label className="label" htmlFor="item-name">Name</label>
                                        <input
                                            id="item-name"
                                            className="input"
                                            placeholder="e.g. Blue Oxford Shirt"
                                            value={newItem.name}
                                            onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                            disabled={isDetecting || isSavingManualAdd}
                                        />
                                    </div>
                                    <div>
                                        <label className="label" htmlFor="item-category">Category</label>
                                        <select
                                            id="item-category"
                                            className="select"
                                            value={newItem.category}
                                            onChange={e => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                                            disabled={isDetecting || isSavingManualAdd}
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
                                            disabled={isDetecting || isSavingManualAdd}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal__footer">
                            <button
                                className="btn btn--secondary"
                                onClick={() => {
                                    setShowAddModal(false);
                                    setShowManualFieldsAfterUpload(false);
                                }}
                                disabled={isDetecting || isSavingManualAdd}
                            >
                                Cancel
                            </button>
                            {newItem.image && !showManualFieldsAfterUpload ? null : (
                                <button
                                    className="btn btn--primary"
                                    onClick={handleAddItem}
                                    id="confirm-add-btn"
                                    disabled={isDetecting || isSavingManualAdd || (Boolean(newItem.image) && !showManualFieldsAfterUpload)}
                                >
                                    {isSavingManualAdd ? 'Saving…' : 'Add Item'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showDetectionModal && (
                <div className="modal-overlay" onClick={() => !isSavingDetection && setShowDetectionModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">Pick Best Prediction</h2>
                            <button className="modal__close" onClick={() => !isSavingDetection && setShowDetectionModal(false)}>×</button>
                        </div>
                        <div className="modal__body">
                            <p className="detection-help-text">Top 3 predictions from the model. Choose the correct one.</p>
                            <div className="detection-options">
                                {detectionChoices.map((item, idx) => (
                                    <button
                                        key={`${item.category}-${item.confidence}-${idx}`}
                                        className="detection-option"
                                        onClick={() => handleSelectDetection(item)}
                                        disabled={isSavingDetection}
                                    >
                                        <div className="detection-option__title">{item.display_name || item.category}</div>
                                        <div className="detection-option__meta">
                                            <span>{item.category}</span>
                                            <span>{Math.round((item.confidence || 0) * 100)}%</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="manual-override">
                                <div className="manual-override__title">Manual Override</div>
                                <div className="manual-override__row">
                                    <select
                                        className="select"
                                        value={manualCategory}
                                        onChange={(e) => setManualCategory(e.target.value)}
                                        disabled={isSavingDetection}
                                    >
                                        {modelClassOptions.map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                    <input
                                        className="input"
                                        value={manualColor}
                                        onChange={(e) => setManualColor(e.target.value.toLowerCase())}
                                        placeholder="color (e.g. navy)"
                                        disabled={isSavingDetection}
                                    />
                                </div>
                                <button
                                    className="btn btn--secondary"
                                    onClick={handleManualOverrideSave}
                                    disabled={isSavingDetection || !manualCategory || !manualColor}
                                >
                                    {isSavingDetection ? 'Saving...' : 'Use Manual Selection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Wardrobe;
