import { useState } from 'react';
import { styleOptions, colorOptions } from '../../data/mockData';
import './Profile.css';

function Profile() {
    const [profile, setProfile] = useState({
        gender: '',
        age: '',
        styles: [],
        colors: [],
    });
    const [saved, setSaved] = useState(false);

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
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="profile-panel">
            <div className="panel-header">
                <h1 className="panel-header__title">Profile</h1>
                <p className="panel-header__subtitle">
                    Personalize your style preferences
                </p>
            </div>

            <div className="profile-layout">
                {/* Avatar / User Card */}
                <div className="profile-sidebar">
                    <div className="card profile-avatar-card">
                        <div className="profile-avatar">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-tertiary)' }}>
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                            </svg>
                        </div>
                        <div className="profile-avatar-card__name">Your Profile</div>
                        <div className="profile-avatar-card__sub">Setup your style identity</div>
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
