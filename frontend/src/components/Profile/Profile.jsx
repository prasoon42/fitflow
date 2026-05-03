import { useEffect, useMemo, useRef, useState } from 'react';
import { styleOptions, colorOptions } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useWardrobe } from '../../context/WardrobeContext';
import { profileStorageKey, loadProfileFromStorage } from '../../utils/profileStorage';
import './Profile.css';

function Profile() {
    const { user, updateUserName, updateUserAvatar } = useAuth();
    const { wardrobeItems } = useWardrobe();
    const displayName = user?.name || 'User';
    const fileInputRef = useRef(null);
    const storageKey = useMemo(() => profileStorageKey(user?.email), [user?.email]);
    const [profile, setProfile] = useState({
        gender: '',
        age: '',
        styles: [],
        colors: [],
    });
    const [saved, setSaved] = useState(false);
    const [editedName, setEditedName] = useState(displayName);
    const [dpError, setDpError] = useState('');
    const favoriteColorsSummary = profile.colors.length > 0 ? profile.colors.slice(0, 3).join(', ') : 'Not set';

    useEffect(() => {
        const parsed = loadProfileFromStorage(user?.email);
        if (!parsed) {
            setProfile({
                gender: '',
                age: '',
                styles: [],
                colors: [],
            });
            return;
        }
        setProfile({
            gender: parsed?.gender || '',
            age: parsed?.age ?? '',
            styles: Array.isArray(parsed?.styles) ? parsed.styles : [],
            colors: Array.isArray(parsed?.colors) ? parsed.colors : [],
        });
    }, [storageKey, user?.email]);

    useEffect(() => {
        setEditedName(displayName);
    }, [displayName]);

    const handleGenderChange = (e) => {
        setProfile(prev => ({ ...prev, gender: e.target.value }));
    };

    const handleAgeChange = (e) => {
        setProfile(prev => ({ ...prev, age: e.target.value }));
    };

    const toggleStyle = (style) => {
        setProfile(prev => ({
            ...prev,
            styles: prev.styles.includes(style)
                ? prev.styles.filter(s => s !== style)
                : [...prev.styles, style],
        }));
    };

    const toggleColor = (colorName) => {
        setProfile(prev => ({
            ...prev,
            colors: prev.colors.includes(colorName)
                ? prev.colors.filter(c => c !== colorName)
                : [...prev.colors, colorName],
        }));
    };

    const handleSave = () => {
        localStorage.setItem(storageKey, JSON.stringify(profile));
        
        if (editedName.trim() !== displayName) {
            updateUserName(editedName);
        }
        
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleNameSave = () => {
        const ok = updateUserName(editedName);
        if (!ok) return;
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDpChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (user?.avatar) {
            setDpError('DP is already set and cannot be changed.');
            e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const ok = updateUserAvatar(reader.result);
            if (!ok) {
                setDpError('DP is already set and cannot be changed.');
                return;
            }
            setDpError('');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    return (
        <div className="profile-panel">
            <div className="panel-header">
                <h1 className="panel-header__title">{displayName}'s Profile</h1>
                <p className="panel-header__subtitle">
                    Personalize your style preferences and fit recommendations
                </p>
            </div>

            <div className="profile-layout">
                {/* Avatar / User Card */}
                <div className="profile-sidebar">
                    <div className="card profile-avatar-card">
                        <div className="profile-avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={displayName} className="profile-avatar__img" />
                            ) : (
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                                </svg>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleDpChange}
                            style={{ display: 'none' }}
                        />
                        {!user?.avatar && (
                            <button
                                className="btn btn--secondary btn--sm profile-avatar__btn"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Set DP
                            </button>
                        )}
                        {dpError && <div className="profile-avatar__error">{dpError}</div>}
                        <div className="profile-avatar-card__name">{displayName}</div>
                        <div className="profile-avatar-card__sub">{user?.email || 'Setup your style identity'}</div>
                        <div className="profile-about">
                            <div className="profile-about__row">
                                <span className="profile-about__label">Gender</span>
                                <span className="profile-about__value">{profile.gender || 'Not set'}</span>
                            </div>
                            <div className="profile-about__row">
                                <span className="profile-about__label">Age</span>
                                <span className="profile-about__value">{profile.age || 'Not set'}</span>
                            </div>
                            <div className="profile-about__row">
                                <span className="profile-about__label">Fav Colors</span>
                                <span className="profile-about__value">{favoriteColorsSummary}</span>
                            </div>
                            <div className="profile-about__row">
                                <span className="profile-about__label">Outfits</span>
                                <span className="profile-about__value">{wardrobeItems.length}</span>
                            </div>
                        </div>
                        <div className="profile-avatar-card__stats">
                            <div className="profile-stat">
                                <span className="profile-stat__value">{profile.styles.length}</span>
                                <span className="profile-stat__label">Styles</span>
                            </div>
                            <div className="profile-stat">
                                <span className="profile-stat__value">{profile.colors.length}</span>
                                <span className="profile-stat__label">Colors</span>
                            </div>
                        </div>
                    </div>

                    <div className="card profile-tips-card">
                        <div className="profile-tips-card__title">Style Tips</div>
                        <ul className="profile-tips-card__list">
                            <li>Select 3-5 styles for best outfit recommendations</li>
                            <li>Pick colors you reach for most often</li>
                            <li>Update your profile as your taste evolves</li>
                        </ul>
                    </div>
                </div>

                {/* Main form */}
                <div className="profile-main">
                    <div className="card profile-card">
                        <div className="profile-form">
                            <div className="profile-form__row">
                                <div className="profile-form__group profile-form__group--full">
                                    <label className="label" htmlFor="name-input">Username</label>
                                    <div className="profile-name-row">
                                        <input
                                            id="name-input"
                                            className="input"
                                            placeholder="Enter your name"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                        />
                                        <button
                                            className="btn btn--secondary"
                                            onClick={handleNameSave}
                                            disabled={!editedName.trim()}
                                        >
                                            Save Name
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-form__row">
                                <div className="profile-form__group">
                                    <label className="label" htmlFor="gender-select">Gender</label>
                                    <select
                                        id="gender-select"
                                        className="select"
                                        value={profile.gender}
                                        onChange={handleGenderChange}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="profile-form__group">
                                    <label className="label" htmlFor="age-input">Age</label>
                                    <input
                                        id="age-input"
                                        type="number"
                                        className="input"
                                        placeholder="Enter age"
                                        value={profile.age}
                                        onChange={handleAgeChange}
                                        min="10"
                                        max="100"
                                    />
                                </div>
                            </div>

                            <div className="profile-form__group">
                                <label className="label">Style Preferences</label>
                                <div className="chips">
                                    {styleOptions.map(style => (
                                        <button
                                            key={style}
                                            className={`chip ${profile.styles.includes(style) ? 'chip--selected' : ''}`}
                                            onClick={() => toggleStyle(style)}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="profile-form__group">
                                <label className="label">Favorite Colors</label>
                                <div className="color-swatches">
                                    {colorOptions.map(color => (
                                        <button
                                            key={color.name}
                                            className={`color-swatch ${profile.colors.includes(color.name) ? 'color-swatch--selected' : ''}`}
                                            style={{ backgroundColor: color.hex }}
                                            onClick={() => toggleColor(color.name)}
                                            title={color.name}
                                            aria-label={`Select ${color.name}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="profile-form__actions">
                                <button className="btn btn--primary" onClick={handleSave} id="save-profile-btn">
                                    Save Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {saved && (
                <div className="save-toast">✓ Profile saved successfully</div>
            )}
        </div>
    );
}

export default Profile;
