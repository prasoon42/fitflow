import { useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import Profile from '../Profile/Profile';
import Wardrobe from '../Wardrobe/Wardrobe';
import OutfitBuilder from '../OutfitBuilder/OutfitBuilder';
import Laundry from '../Laundry/Laundry';
import Favourites from '../Favourites/Favourites';
import './Layout.css';

const panels = {
    profile: Profile,
    wardrobe: Wardrobe,
    'outfit-builder': OutfitBuilder,
    laundry: Laundry,
    favourites: Favourites,
};

function Layout() {
    const [activePanel, setActivePanel] = useState('profile');
    const ActiveComponent = panels[activePanel];

    return (
        <div className="layout">
            <TopBar />
            <div className="layout__body">
                <Sidebar activePanel={activePanel} onPanelChange={setActivePanel} />
                <main className="layout__main">
                    <ActiveComponent />
                </main>
            </div>
        </div>
    );
}

export default Layout;
