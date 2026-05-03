import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE } from '../config';
import { matchesWardrobeTab } from '../utils/wardrobeCategories';

const WardrobeContext = createContext();

export function WardrobeProvider({ children }) {
    const [wardrobeItems, setWardrobeItems] = useState([]);
    const [favouriteOutfits, setFavouriteOutfits] = useState([]);
    const [busyIds, setBusyIds] = useState(new Set());
    const [loadingWardrobe, setLoadingWardrobe] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        if (token) {
            fetchWardrobe();
        }
    }, [token]);

    const fetchWardrobe = async () => {
        setLoadingWardrobe(true);
        try {
            const res = await fetch(`${API_BASE}/wardrobe`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                // Map backend format to frontend format
                const mappedItems = data.items.map(item => ({
                    id: item._id,
                    name: item.display_name || item.category,
                    category: item.category,
                    color: item.color,
                    image: item.image,
                    status: item.status,
                    lastWashedAt: item.last_washed_at || null,
                    createdAt: item.created_at || null,
                }));
                setWardrobeItems(mappedItems);
            }
        } catch (err) {
            console.error("Failed to fetch wardrobe", err);
        } finally {
            setLoadingWardrobe(false);
        }
    };

    // Add a new clothing item
    const addClothingItem = (item) => {
        // Now items are added directly after successful upload in Wardrobe.jsx
        // but we keep this function to easily update state
        const newItem = {
            ...item,
            id: item.id || Date.now(), // Fallback ID
            status: item.status || 'available',
        };
        setWardrobeItems(prev => [...prev, newItem]);
    };

    // Remove a clothing item
    const removeClothingItem = async (id) => {
        if (!token) return;
        setBusyIds(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`${API_BASE}/wardrobe/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete item');
            setWardrobeItems(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error("Failed to remove item", err);
        } finally {
            setBusyIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    // Move item to laundry
    const updateItemStatus = async (id, status) => {
        if (!token) return;
        setBusyIds(prev => new Set(prev).add(id));
        try {
            const res = await fetch(`${API_BASE}/wardrobe/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error('Failed to update item status');
            const data = await res.json();
            setWardrobeItems(prev =>
                prev.map(item => item.id === id ? {
                    ...item,
                    status: data.item.status,
                    lastWashedAt: data.item.last_washed_at || item.lastWashedAt || null,
                    createdAt: data.item.created_at || item.createdAt || null,
                } : item)
            );
        } catch (err) {
            console.error("Failed to update item status", err);
        } finally {
            setBusyIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const moveToLaundry = (id) => {
        updateItemStatus(id, 'laundry');
    };

    // Return item from laundry
    const returnFromLaundry = (id) => {
        updateItemStatus(id, 'available');
    };

    // Save outfit to favourites
    const saveOutfit = (outfit) => {
        setFavouriteOutfits(prev => [...prev, { ...outfit, id: Date.now() }]);
    };

    // Remove outfit from favourites
    const removeOutfit = (id) => {
        setFavouriteOutfits(prev => prev.filter(o => o.id !== id));
    };

    // Get items by category (same broad-tab rules as Wardrobe UI)
    const getItemsByCategory = (category) => {
        return wardrobeItems.filter(item => matchesWardrobeTab(item, category));
    };

    // Get available items
    const getAvailableItems = () => {
        return wardrobeItems.filter(item => item.status === 'available');
    };

    // Get laundry items
    const getLaundryItems = () => {
        return wardrobeItems.filter(item => item.status === 'laundry');
    };

    return (
        <WardrobeContext.Provider
            value={{
                wardrobeItems,
                favouriteOutfits,
                addClothingItem,
                removeClothingItem,
                moveToLaundry,
                returnFromLaundry,
                saveOutfit,
                removeOutfit,
                getItemsByCategory,
                getAvailableItems,
                getLaundryItems,
                busyIds,
                loadingWardrobe,
            }}
        >
            {children}
        </WardrobeContext.Provider>
    );
}

export function useWardrobe() {
    const context = useContext(WardrobeContext);
    if (!context) throw new Error('useWardrobe must be used within WardrobeProvider');
    return context;
}
