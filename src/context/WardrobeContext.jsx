import { createContext, useContext, useState } from 'react';
import { initialWardrobeItems } from '../data/mockData';

const WardrobeContext = createContext();

export function WardrobeProvider({ children }) {
    const [wardrobeItems, setWardrobeItems] = useState(initialWardrobeItems);
    const [favouriteOutfits, setFavouriteOutfits] = useState([]);
    const [nextId, setNextId] = useState(100);

    // Add a new clothing item
    const addClothingItem = (item) => {
        const newItem = {
            ...item,
            id: nextId,
            status: 'available',
        };
        setWardrobeItems(prev => [...prev, newItem]);
        setNextId(prev => prev + 1);
    };

    // Remove a clothing item
    const removeClothingItem = (id) => {
        setWardrobeItems(prev => prev.filter(item => item.id !== id));
    };

    // Move item to laundry
    const moveToLaundry = (id) => {
        setWardrobeItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, status: 'laundry' } : item
            )
        );
    };

    // Return item from laundry
    const returnFromLaundry = (id) => {
        setWardrobeItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, status: 'available' } : item
            )
        );
    };

    // Save outfit to favourites
    const saveOutfit = (outfit) => {
        setFavouriteOutfits(prev => [...prev, { ...outfit, id: Date.now() }]);
    };

    // Remove outfit from favourites
    const removeOutfit = (id) => {
        setFavouriteOutfits(prev => prev.filter(o => o.id !== id));
    };

    // Get items by category
    const getItemsByCategory = (category) => {
        return wardrobeItems.filter(item => item.category === category);
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
